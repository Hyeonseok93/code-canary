import type { AdminSession } from '../types/explorer';

const ADMIN_ROLE = 'ROLE_ADMIN';

export const isAdminRole = (role: string | null | undefined): boolean => role === ADMIN_ROLE;

export const isAuthenticatedAdmin = (session: AdminSession | undefined): boolean =>
  Boolean(session?.authenticated && session.username && isAdminRole(session.role));
