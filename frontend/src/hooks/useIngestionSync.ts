import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

interface IngestionSyncResponse {
  nvdLastCollectedAt: string | null;
  osvLastCollectedAt: string | null;
}

export const useIngestionSync = () =>
  useQuery<IngestionSyncResponse>({
    queryKey: ['ingestion-sync'],
    queryFn: async () => {
      const { data } = await apiClient.get<IngestionSyncResponse>('/api/analytics/sync');
      return data;
    },
    staleTime: 120_000,
  });
