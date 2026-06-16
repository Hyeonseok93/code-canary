import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  getAxiosStatus,
  isCsrfForbiddenError,
  isRateLimited,
  isServiceUnavailable,
} from './errors';

function axiosError(status: number, data?: unknown): AxiosError {
  return new AxiosError(
    'Request failed',
    String(status),
    {} as InternalAxiosRequestConfig,
    {},
    { status, data, statusText: 'Error', headers: {}, config: {} as InternalAxiosRequestConfig } as AxiosResponse
  );
}

describe('isServiceUnavailable', () => {
  it('detects 5xx and network errors', () => {
    expect(isServiceUnavailable(503)).toBe(true);
    expect(isServiceUnavailable(404)).toBe(false);
    expect(isServiceUnavailable(undefined, 'ERR_NETWORK')).toBe(true);
  });
});

describe('isRateLimited', () => {
  it('detects 429', () => {
    expect(isRateLimited(429)).toBe(true);
    expect(isRateLimited(403)).toBe(false);
  });
});

describe('getAxiosStatus', () => {
  it('reads status from axios errors', () => {
    expect(getAxiosStatus(axiosError(418))).toBe(418);
    expect(getAxiosStatus(new Error('nope'))).toBeUndefined();
  });
});

describe('isCsrfForbiddenError', () => {
  it('matches CSRF-specific 403 messages', () => {
    expect(isCsrfForbiddenError(axiosError(403, { message: 'CSRF validation failed.' }))).toBe(true);
    expect(isCsrfForbiddenError(axiosError(403, { message: 'Access denied.' }))).toBe(false);
    expect(isCsrfForbiddenError(axiosError(401))).toBe(false);
  });
});
