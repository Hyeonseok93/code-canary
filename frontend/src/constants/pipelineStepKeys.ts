/** Keep in sync with backend PipelineStepKeys.java and worker/tasks.py STEP_MENU. */
export const PIPELINE_STEP_KEYS = {
  NVD_COLLECT: 'nvd-collect',
  NVD_LOAD: 'nvd-load',
  NVD_SILVER: 'nvd-silver',
  OSV_COLLECT: 'osv-collect',
  OSV_LOAD: 'osv-load',
  OSV_SILVER: 'osv-silver',
  GOLD_REFRESH: 'gold-refresh',
} as const;

/** Keep in sync with backend PipelineStepKeys.CANCELLABLE_STEPS */
export const CANCELLABLE_COLLECT_STEPS = new Set<string>([
  PIPELINE_STEP_KEYS.NVD_COLLECT,
  PIPELINE_STEP_KEYS.OSV_COLLECT,
]);
