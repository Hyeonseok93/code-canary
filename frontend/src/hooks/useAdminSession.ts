import { useQuery } from '@tanstack/react-query';
import adminApiClient from '../api/adminApiClient';
import type { AdminSession } from '../types/explorer';

export const ADMIN_SESSION_QUERY_KEY = ['adminSession'] as const;

export const useAdminSession = () =>
  useQuery<AdminSession>({
    queryKey: ADMIN_SESSION_QUERY_KEY,
    queryFn: async () => {
      const response = await adminApiClient.get<AdminSession>('/api/auth/session');
      return response.data;
    },
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
