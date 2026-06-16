import type { PipelineStepMeta } from '../types/pipeline';
import { PIPELINE_STEP_KEYS } from './pipelineStepKeys';

export const NVD_PIPELINE_STEPS: PipelineStepMeta[] = [
  {
    id: PIPELINE_STEP_KEYS.NVD_COLLECT,
    shortLabel: 'Collect',
    description: 'Pull CVE JSON feeds from NVD 2.0 into local staging.',
  },
  {
    id: PIPELINE_STEP_KEYS.NVD_LOAD,
    shortLabel: 'Bronze',
    description: 'Upsert raw JSON into bronze.raw_vulnerability_data.',
  },
  {
    id: PIPELINE_STEP_KEYS.NVD_SILVER,
    shortLabel: 'Silver',
    description: 'Parse CVE records into normalized silver tables.',
  },
];

export const OSV_PIPELINE_STEPS: PipelineStepMeta[] = [
  {
    id: PIPELINE_STEP_KEYS.OSV_COLLECT,
    shortLabel: 'Collect',
    description: 'Stream all.zip from OSV object storage to local staging.',
  },
  {
    id: PIPELINE_STEP_KEYS.OSV_LOAD,
    shortLabel: 'Bronze',
    description: 'Batch upsert OSV advisories into bronze layer.',
  },
  {
    id: PIPELINE_STEP_KEYS.OSV_SILVER,
    shortLabel: 'Silver',
    description: 'Normalize affected packages, aliases, and severities.',
  },
];

export const STEP_META_BY_ID = new Map<string, PipelineStepMeta>(
  [...NVD_PIPELINE_STEPS, ...OSV_PIPELINE_STEPS].map((step) => [step.id, step])
);

export const SOURCE_ACCENT: Record<'NVD' | 'OSV', 'blue' | 'emerald'> = {
  NVD: 'blue',
  OSV: 'emerald',
};
