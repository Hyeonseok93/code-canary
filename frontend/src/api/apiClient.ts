import axios from 'axios';
import { useUIStore } from '../store/useUIStore';
import { isServiceUnavailable } from './errors';

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined;

    if (status === 429) {
      return Promise.reject(error);
    }

    if (isServiceUnavailable(status, error.code)) {
      useUIStore.getState().setSystemError(true);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
