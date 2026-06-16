import {
  ECOSYSTEM_COLORS,
  REMEDIATION_COLORS,
  SEVERITY_COLORS,
  VECTOR_COLORS,
} from './dashboardConstants';
import { EXPLORER_SOURCE_OPTIONS } from './sourceMeta';

export const EXPLORER_SEVERITY_OPTIONS = Object.keys(SEVERITY_COLORS);
export { EXPLORER_SOURCE_OPTIONS };
export const EXPLORER_VECTOR_OPTIONS = [...Object.keys(VECTOR_COLORS), 'Not Specified'] as const;
export const EXPLORER_STATUS_OPTIONS = [
  'Active',
  'Modified',
  'Analyzed',
  'Deferred',
  'Withdrawn',
  'Rejected',
  'Awaiting Analysis',
  'Received',
  'Undergoing Analysis',
] as const;
export const EXPLORER_REMEDIATION_OPTIONS = Object.keys(REMEDIATION_COLORS);
export const EXPLORER_PILLAR_OPTIONS = [
  'Injection & Input Validation',
  'Memory Safety',
  'Auth & Access Control',
  'Crypto & Data Security',
  'Resource Management',
  'Logic & Design Errors',
  'Others & Unclassified',
  'Not Specified',
] as const;
export const EXPLORER_ECOSYSTEM_OPTIONS = [
  'npm',
  'PyPI',
  'Maven',
  'Go',
  'NuGet',
  'RubyGems',
  'Debian',
  'Not Specified',
].filter((value) => value === 'Not Specified' || value in ECOSYSTEM_COLORS) as readonly string[];

export const EMPTY_EXPLORER_FILTERS = {
  source: '',
  vector: '',
  status: '',
  remediation: '',
  pillar: '',
  ecosystem: '',
  severity: '',
  search: '',
};
