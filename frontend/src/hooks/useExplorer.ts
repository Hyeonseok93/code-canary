import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { appendExplorerFiltersToSearchParams } from '../utils/explorerSearchParams';
import type { ExplorerFilters, ExplorerPageResponse } from '../types/explorer';

export const useExplorerData = (page: number, size: number = 50, filters: ExplorerFilters = {}) =>
  useQuery<ExplorerPageResponse>({
    queryKey: ['explorerData', page, size, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      appendExplorerFiltersToSearchParams(params, filters, filters.search);

      const response = await apiClient.get<ExplorerPageResponse>(`/api/analytics/explorer?${params.toString()}`);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
