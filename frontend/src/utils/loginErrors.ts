import axios from 'axios';

export function resolveLoginError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return 'Unable to reach the authentication service. Check your connection.';
  }

  const status = err.response?.status;

  if (status === 400 || status === 401 || status === 403) {
    return 'Login failed.';
  }
  if (status === 429) {
    return 'Too many login attempts. Please wait a minute and try again.';
  }
  if (status === undefined || err.code === 'ERR_NETWORK') {
    return 'Unable to reach the authentication service. Check your connection.';
  }
  if (status >= 500) {
    return 'Authentication service is temporarily unavailable. Try again later.';
  }

  return 'Login failed.';
}
