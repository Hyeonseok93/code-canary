import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import adminApiClient from '../api/adminApiClient';
import {
  NVD_PIPELINE_STEPS,
  OSV_PIPELINE_STEPS,
  SOURCE_ACCENT,
  STEP_META_BY_ID,
} from '../constants/pipelineSteps';
import type {
  DataSourcePipelineView,
  EnqueueJobResponse,
  GoldSummaryView,
  PipelineActivityEntry,
  PipelineStatusResponse,
  PipelineStepStatus,
  ReleaseStuckJobsResponse,
  RunStepOptions,
  StopJobResponse,
} from '../types/pipeline';
import { formatPipelineDuration } from '../utils/pipelineFormat';
import { sanitizeOperatorMessage } from '../utils/operatorMessage';
import { resolvePipelineActionError } from '../utils/pipelineErrors';
import {
  PIPELINE_ACTIVITY_KEY,
  PIPELINE_STAGING_KEY,
  PIPELINE_STATUS_KEY,
} from './pipelineQueryKeys';

const refreshPipelineQueries = async (queryClient: QueryClient, includeStaging = false) => {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: PIPELINE_STATUS_KEY }),
    queryClient.invalidateQueries({ queryKey: PIPELINE_ACTIVITY_KEY }),
  ];
  if (includeStaging) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: PIPELINE_STAGING_KEY }));
  }
  await Promise.all(invalidations);
  await queryClient.refetchQueries({ queryKey: PIPELINE_STATUS_KEY });
};

const normalizeStepStatus = (status: string): PipelineStepStatus => {
  if (status === 'running' || status === 'success' || status === 'failed' || status === 'pending') {
    return status;
  }
  return 'idle';
};

const buildStepViews = (
  stepIds: string[],
  apiSteps: PipelineStatusResponse['sources'][number]['steps']
): DataSourcePipelineView['steps'] => {
  const apiById = new Map(apiSteps.map((step) => [step.id, step]));

  return stepIds.map((id) => {
    const meta = STEP_META_BY_ID.get(id);
    const api = apiById.get(id);
    if (!meta) {
      throw new Error(`Missing pipeline step metadata for ${id}`);
    }

    return {
      ...meta,
      status: normalizeStepStatus(api?.status ?? 'idle'),
      lastRunAt: api?.lastRunAt ?? null,
      durationLabel: formatPipelineDuration(api?.durationSeconds ?? null),
      lastJobId: api?.lastJobId ?? null,
      errorMessage: sanitizeOperatorMessage(api?.errorMessage ?? null),
    };
  });
};

const mapStatusResponse = (data: PipelineStatusResponse) => {
  const nvd = data.sources.find((source) => source.source === 'NVD');
  const osv = data.sources.find((source) => source.source === 'OSV');

  const pipelines: DataSourcePipelineView[] = [];

  if (nvd) {
    pipelines.push({
      source: 'NVD',
      accent: SOURCE_ACCENT.NVD,
      lastCollectedAt: nvd.lastCollectedAt,
      syncStatus: nvd.syncStatus,
      recordsInBronze: nvd.recordsInBronze,
      pendingSilver: nvd.pendingSilver,
      recordsInSilver: nvd.recordsInSilver,
      steps: buildStepViews(
        NVD_PIPELINE_STEPS.map((step) => step.id),
        nvd.steps
      ),
    });
  }

  if (osv) {
    pipelines.push({
      source: 'OSV',
      accent: SOURCE_ACCENT.OSV,
      lastCollectedAt: osv.lastCollectedAt,
      syncStatus: osv.syncStatus,
      recordsInBronze: osv.recordsInBronze,
      pendingSilver: osv.pendingSilver,
      recordsInSilver: osv.recordsInSilver,
      steps: buildStepViews(
        OSV_PIPELINE_STEPS.map((step) => step.id),
        osv.steps
      ),
    });
  }

  const gold: GoldSummaryView = {
    lastRefreshedAt: data.gold.lastRefreshedAt,
    explorerRows: data.gold.explorerRows,
    status: normalizeStepStatus(data.gold.status),
    lastRunAt: data.gold.lastRunAt ?? null,
    durationLabel: formatPipelineDuration(data.gold.durationSeconds ?? null),
    lastJobId: data.gold.lastJobId ?? null,
    errorMessage: sanitizeOperatorMessage(data.gold.errorMessage ?? null),
  };

  const hasActiveJob =
    pipelines.some(
      (pipeline) =>
        pipeline.syncStatus === 'running' ||
        pipeline.syncStatus === 'pending' ||
        pipeline.steps.some((step) => step.status === 'running' || step.status === 'pending')
    ) ||
    gold.status === 'running' ||
    gold.status === 'pending';

  const hasRunningJob =
    pipelines.some(
      (pipeline) =>
        pipeline.syncStatus === 'running' ||
        pipeline.steps.some((step) => step.status === 'running')
    ) || gold.status === 'running';

  return { pipelines, gold, hasActiveJob, hasRunningJob };
};

interface UsePipelineControlOptions {
  activityLimit?: number;
  fetchActivity?: boolean;
}

export const usePipelineControl = (options?: UsePipelineControlOptions) => {
  const activityLimit = options?.activityLimit ?? 50;
  const fetchActivity = options?.fetchActivity ?? false;
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [enqueueLock, setEnqueueLock] = useState(false);

  const statusQuery = useQuery({
    queryKey: PIPELINE_STATUS_KEY,
    queryFn: async () => {
      const { data } = await adminApiClient.get<PipelineStatusResponse>('/api/admin/pipeline/status');
      return mapStatusResponse(data);
    },
    refetchInterval: (query) => (query.state.data?.hasActiveJob ? 3000 : 15000),
  });

  const activityQuery = useQuery({
    queryKey: [...PIPELINE_ACTIVITY_KEY, activityLimit],
    enabled: fetchActivity,
    queryFn: async () => {
      const { data } = await adminApiClient.get<{ entries: PipelineActivityEntry[] }>(
        '/api/admin/pipeline/activity',
        { params: { limit: activityLimit } }
      );
      return data.entries;
    },
    refetchInterval: fetchActivity ? (statusQuery.data?.hasActiveJob ? 5000 : 20000) : false,
  });

  const enqueueMutation = useMutation({
    mutationFn: async ({ stepKey, stagingRef, collectMode }: RunStepOptions) => {
      const payload: {
        stepKey: string;
        stagingRef?: string;
        collectMode?: string;
      } = { stepKey };
      if (stagingRef) {
        payload.stagingRef = stagingRef;
      }
      if (collectMode) {
        payload.collectMode = collectMode;
      }
      const { data } = await adminApiClient.post<EnqueueJobResponse>('/api/admin/pipeline/jobs', payload);
      return data;
    },
    onMutate: () => {
      setEnqueueLock(true);
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshPipelineQueries(queryClient, true);
    },
    onError: (error: unknown) => {
      setActionError(resolvePipelineActionError(error, 'Failed to enqueue pipeline job.'));
    },
    onSettled: () => {
      setEnqueueLock(false);
    },
  });

  const releaseStuckMutation = useMutation({
    mutationFn: async () => {
      const { data } = await adminApiClient.post<ReleaseStuckJobsResponse>(
        '/api/admin/pipeline/jobs/stuck/release'
      );
      return data;
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshPipelineQueries(queryClient);
    },
    onError: (error: unknown) => {
      setActionError(resolvePipelineActionError(error, 'Failed to release stuck job.'));
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (stepKey: string) => {
      const { data } = await adminApiClient.post<StopJobResponse>('/api/admin/pipeline/jobs/stop', {
        stepKey,
      });
      return data;
    },
    onSuccess: async () => {
      setActionError(null);
      await refreshPipelineQueries(queryClient);
    },
    onError: (error: unknown) => {
      setActionError(resolvePipelineActionError(error, 'Failed to stop pipeline job.'));
    },
  });

  const runStep = useCallback(
    (stepKey: string, options?: Omit<RunStepOptions, 'stepKey'>) => {
      if (enqueueMutation.isPending || enqueueLock || statusQuery.data?.hasActiveJob) {
        return;
      }
      enqueueMutation.mutate({
        stepKey,
        stagingRef: options?.stagingRef ?? null,
        collectMode: options?.collectMode ?? null,
      });
    },
    [enqueueLock, enqueueMutation, statusQuery.data?.hasActiveJob]
  );

  const clearActionError = useCallback(() => setActionError(null), []);

  const releaseStuckJob = useCallback(() => {
    if (releaseStuckMutation.isPending) {
      return;
    }
    releaseStuckMutation.mutate();
  }, [releaseStuckMutation]);

  const stopStep = useCallback(
    (stepKey: string) => {
      if (stopMutation.isPending) {
        return;
      }
      stopMutation.mutate(stepKey);
    },
    [stopMutation]
  );

  const isRunning = useMemo(
    () => Boolean(statusQuery.data?.hasActiveJob || enqueueMutation.isPending || enqueueLock),
    [enqueueLock, enqueueMutation.isPending, statusQuery.data?.hasActiveJob]
  );

  const pendingStepKey = enqueueMutation.isPending ? (enqueueMutation.variables?.stepKey ?? null) : null;
  const stoppingStepKey = stopMutation.isPending ? (stopMutation.variables ?? null) : null;

  return {
    pipelines: statusQuery.data?.pipelines ?? [],
    gold: statusQuery.data?.gold,
    activity: activityQuery.data ?? [],
    isLoading: statusQuery.isLoading,
    isActivityLoading: activityQuery.isLoading,
    isRunning,
    hasRunningJob: statusQuery.data?.hasRunningJob ?? false,
    runStep,
    stopStep,
    releaseStuckJob,
    isReleasingStuck: releaseStuckMutation.isPending,
    pendingStepKey,
    stoppingStepKey,
    actionError,
    clearActionError,
  };
};
