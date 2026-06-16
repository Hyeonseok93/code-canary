export const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#EAB308',
  Low: '#22C55E',
  None: '#737373',
};

export const VECTOR_COLORS: Record<string, string> = {
  NETWORK: '#3B82F6',
  ADJACENT: '#10B981',
  LOCAL: '#F59E0B',
  PHYSICAL: '#EF4444',
};

export { SOURCE_COLORS } from './sourceMeta';

export const ECOSYSTEM_COLORS: Record<string, string> = {
  npm: '#CB3837',
  PyPI: '#3776AB',
  Go: '#00ADD8',
  Maven: '#C71A36',
  NuGet: '#004880',
  Packagist: '#F28D1A',
  RubyGems: '#E9573F',
  'GitHub Actions': '#2088FF',
  Android: '#3DDC84',
  Debian: '#A81D33',
  Alpine: '#004481',
  Ubuntu: '#E95420',
  'Azure Linux': '#0078D4',
  Alpaquita: '#FFD700',
};

export const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  None: 4,
};

export const REMEDIATION_COLORS: Record<string, string> = {
  'Patch Ready': '#22C55E',
  'Solution Provided': '#3B82F6',
  Pending: '#EAB308',
  Unpatched: '#EF4444',
  'End of Life': '#F97316',
  Invalid: '#737373',
};
