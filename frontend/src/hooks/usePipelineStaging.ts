import { useQuery } from '@tanstack/react-query';
import adminApiClient from '../api/adminApiClient';
import type { PipelineStagingResponse } from '../types/pipeline';
import { PIPELINE_STAGING_KEY } from './pipelineQueryKeys';

export const usePipelineStaging = () => {
  return useQuery({
    queryKey: PIPELINE_STAGING_KEY,
    queryFn: async () => {
      const { data } = await adminApiClient.get<PipelineStagingResponse>('/api/admin/pipeline/staging');
      return data;
    },
    staleTime: 30_000,
  });
};
