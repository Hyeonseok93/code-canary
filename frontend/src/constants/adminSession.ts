import type { AdminSession } from '../types/explorer';

export const EMPTY_ADMIN_SESSION: AdminSession = {
  authenticated: false,
  username: null,
  role: null,
};
