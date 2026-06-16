export type PipelineStepStatus = 'idle' | 'running' | 'success' | 'failed' | 'pending';

export interface PipelineStepMeta {
  id: string;
  shortLabel: string;
  description: string;
}

interface PipelineStepView extends PipelineStepMeta {
  status: PipelineStepStatus;
  lastRunAt: string | null;
  durationLabel: string | null;
  lastJobId: number | null;
  errorMessage: string | null;
}

export interface DataSourcePipelineView {
  source: 'NVD' | 'OSV';
  accent: 'blue' | 'emerald';
  lastCollectedAt: string | null;
  syncStatus: string;
  recordsInBronze: number;
  pendingSilver: number;
  recordsInSilver: number;
  steps: PipelineStepView[];
}

export interface GoldSummaryView {
  lastRefreshedAt: string | null;
  explorerRows: number;
  status: PipelineStepStatus;
  lastRunAt: string | null;
  durationLabel: string | null;
  lastJobId: number | null;
  errorMessage: string | null;
}

export interface PipelineStatusResponse {
  sources: Array<{
    source: 'NVD' | 'OSV';
    lastCollectedAt: string | null;
    syncStatus: string;
    recordsInBronze: number;
    pendingSilver: number;
    recordsInSilver: number;
    steps: Array<{
      id: string;
      status: PipelineStepStatus;
      lastRunAt: string | null;
      durationSeconds: number | null;
      lastJobId: number | null;
      errorMessage: string | null;
    }>;
  }>;
  gold: {
    lastRefreshedAt: string | null;
    explorerRows: number;
    status: string;
    lastRunAt: string | null;
    durationSeconds: number | null;
    lastJobId: number | null;
    errorMessage: string | null;
  };
}

export interface PipelineActivityEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'error';
  source: 'NVD' | 'OSV' | 'GOLD' | 'SYSTEM';
  stepKey: string;
  message: string;
}

export interface EnqueueJobResponse {
  jobId: number;
  stepKey: string;
  status: string;
}

export interface ReleaseStuckJobsResponse {
  releasedCount: number;
  jobIds: number[];
}

export interface StopJobResponse {
  jobId: number;
  stepKey: string;
  action: 'cancelled_queued' | 'stop_requested' | string;
}

export interface PipelineStagingBaseline {
  id: string;
  label: string;
  modifiedAt: string | null;
  sizeBytes: number;
}

export interface PipelineStagingResponse {
  nvd: PipelineStagingBaseline[];
  osv: PipelineStagingBaseline[];
}

export interface RunStepOptions {
  stepKey: string;
  stagingRef?: string | null;
  collectMode?: 'full' | 'incremental' | null;
}
