import type { PipelineStagingBaseline } from '../types/pipeline';
import { formatSyncDateTime } from './dateTime';

const formatStagingSize = (bytes: number) => {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
};

export const formatStagingBaselineLabel = (baseline: PipelineStagingBaseline) => {
  const modified = formatSyncDateTime(baseline.modifiedAt, { fallback: 'unknown time' });
  return `${baseline.label} · ${modified} · ${formatStagingSize(baseline.sizeBytes)}`;
};
