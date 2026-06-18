import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import adminApiClient from '../api/adminApiClient';
import { clearCsrfTokenCache } from '../api/csrf';
import { EMPTY_ADMIN_SESSION } from '../constants/adminSession';
import { ADMIN_SESSION_QUERY_KEY } from './useAdminSession';
import { ROOST_HATCH } from '../constants/roostPaths';

export const useAdminLogout = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      await adminApiClient.post('/api/admin/logout');
    } finally {
      clearCsrfTokenCache();
      queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, EMPTY_ADMIN_SESSION);
      window.location.assign(ROOST_HATCH);
    }
  }, [queryClient]);
};
