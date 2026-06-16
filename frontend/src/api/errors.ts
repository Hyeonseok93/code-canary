import axios from 'axios';

/** Tier 2: backend + gateway failures (500–599) and network errors */
export const isServiceUnavailable = (status?: number, code?: string): boolean => {
  if (code === 'ERR_NETWORK') return true;
  return status !== undefined && status >= 500 && status < 600;
};

export const isRateLimited = (status?: number): boolean => status === 429;

export const getAxiosStatus = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

export const resolveRateLimitMessage = (): string =>
  'Too many requests. Please wait a moment and try again.';

export const isCsrfForbiddenError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) {
    return false;
  }

  const message = (error.response.data as { message?: string } | undefined)?.message;
  return typeof message === 'string' && message.toLowerCase().includes('csrf');
};
