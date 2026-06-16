import { describe, expect, it } from 'vitest';
import { isAdminRole, isAuthenticatedAdmin } from '../constants/adminRoles';
import type { AdminSession } from '../types/explorer';

describe('isAdminRole', () => {
  it('accepts only ROLE_ADMIN', () => {
    expect(isAdminRole('ROLE_ADMIN')).toBe(true);
    expect(isAdminRole('ROLE_USER')).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });
});

describe('isAuthenticatedAdmin', () => {
  const validSession: AdminSession = {
    authenticated: true,
    username: 'operator',
    role: 'ROLE_ADMIN',
  };

  it('requires authenticated admin session', () => {
    expect(isAuthenticatedAdmin(validSession)).toBe(true);
    expect(isAuthenticatedAdmin({ ...validSession, role: 'ROLE_USER' })).toBe(false);
    expect(isAuthenticatedAdmin({ ...validSession, authenticated: false })).toBe(false);
    expect(isAuthenticatedAdmin(undefined)).toBe(false);
  });
});
