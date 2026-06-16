import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import type {
  DashboardAnalytics,
  EcosystemAnalytics,
  KevInsight,
  RemediationAnalytics,
  VectorAnalytics,
  WeaknessAnalytics,
} from '../types/analytics';

const createAnalyticsQuery =
  <T,>(queryKey: string, path: string) =>
  () =>
    useQuery<T>({
      queryKey: [queryKey],
      queryFn: async () => {
        const { data } = await apiClient.get<T>(path);
        return data;
      },
    });

export const useAnalytics = createAnalyticsQuery<DashboardAnalytics>(
  'dashboardAnalytics',
  '/api/analytics/dashboard'
);

export const useVectorAnalytics = createAnalyticsQuery<VectorAnalytics>(
  'vectorAnalytics',
  '/api/analytics/vector'
);

export const useEcosystemAnalytics = createAnalyticsQuery<EcosystemAnalytics>(
  'ecosystemAnalytics',
  '/api/analytics/ecosystem'
);

export const useWeaknessAnalytics = createAnalyticsQuery<WeaknessAnalytics>(
  'weaknessAnalytics',
  '/api/analytics/weakness'
);

export const useRemediationAnalytics = createAnalyticsQuery<RemediationAnalytics>(
  'remediationAnalytics',
  '/api/analytics/remediation'
);

export const useKevInsights = createAnalyticsQuery<KevInsight[]>(
  'kevInsights',
  '/api/analytics/kev-insights'
);
