import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';

export interface SummaryMetricsResponse {
  metrics: Record<string, number>;
  lastUpdatedAt: string;
}

export const useMetrics = () => {
  return useQuery({
    queryKey: ['summary-metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get<SummaryMetricsResponse>('/api/analytics/metrics');
      return data;
    },
  });
};
