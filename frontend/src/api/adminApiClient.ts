import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useUIStore } from '../store/useUIStore';
import { clearCsrfTokenCache, resolveCsrfToken } from './csrf';
import { isCsrfForbiddenError, isServiceUnavailable } from './errors';
import { ROOST_HATCH, isRoostHatchPath } from '../constants/roostPaths';

type RetriableAxiosRequestConfig = InternalAxiosRequestConfig & {
  __csrfRetried?: boolean;
};

class CsrfUnavailableError extends Error {
  constructor() {
    super('CSRF token unavailable');
    this.name = 'CsrfUnavailableError';
  }
}

const adminApiClient = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();
  if (method && method !== 'get' && method !== 'head' && method !== 'options') {
    const { token, headerName } = await resolveCsrfToken();
    if (!token) {
      return Promise.reject(new CsrfUnavailableError());
    }
    config.headers.set(headerName, token);
  }
  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetriableAxiosRequestConfig | undefined;

    if (status === 403 && config && !config.__csrfRetried && isCsrfForbiddenError(error)) {
      config.__csrfRetried = true;
      clearCsrfTokenCache();
      await resolveCsrfToken();
      return adminApiClient.request(config);
    }

    if (status === 401) {
      if (!isRoostHatchPath(window.location.pathname)) {
        window.location.assign(ROOST_HATCH);
      }
    } else if (isServiceUnavailable(status, error.code)) {
      useUIStore.getState().setSystemError(true);
    }

    return Promise.reject(error);
  }
);

export default adminApiClient;
