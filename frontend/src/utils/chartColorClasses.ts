const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const severityDotClass = (label: string) => `severity-dot-${slug(label)}`;

export const sourceDotClass = (label: string) => {
  const mapped = slug(label);
  if (mapped === 'nvd' || mapped === 'osv' || mapped === 'github' || mapped === 'kev') {
    return `source-dot-${mapped}`;
  }
  return 'source-dot-default';
};

export const remediationDotClass = (label: string) => `remediation-dot-${slug(label)}`;

export const vectorDotClass = (label: string) => `vector-dot-${slug(label)}`;

export const ecosystemDotClass = (name: string, fallbackIndex = 0) => {
  const mapped = slug(name);
  const known = new Set([
    'npm', 'pypi', 'go', 'maven', 'nuget', 'packagist', 'rubygems',
    'github-actions', 'android', 'debian', 'alpine', 'ubuntu', 'azure-linux', 'alpaquita',
  ]);
  if (known.has(mapped)) {
    return `ecosystem-dot-${mapped}`;
  }
  return `ecosystem-fallback-${fallbackIndex % 5}`;
};

export const chartSeriesDotClass = (index: number) => `chart-series-${index % 6}`;

export const scoreBarWidthClass = (score: number) => {
  const pct = Math.min(100, Math.max(0, Math.round(score * 10)));
  return `score-bar-${pct}`;
};

export const scoreGlowClass = (score: number) => {
  if (score >= 9) return 'glow-red';
  if (score >= 7) return 'glow-orange';
  if (score >= 4) return 'glow-yellow';
  return 'glow-blue';
};

export const severityDropGlowClass = (score: number) => {
  if (score >= 9) return 'drop-glow-red';
  if (score >= 7) return 'drop-glow-orange';
  if (score >= 4) return 'drop-glow-yellow';
  return 'drop-glow-blue';
};

export const chartColorGlowClass = (color: string) => {
  const normalized = color.toLowerCase();
  if (normalized.includes('ef4444') || normalized.includes('f97316')) return 'dot-glow-red';
  if (normalized.includes('22c55e') || normalized.includes('10b981')) return 'dot-glow-green';
  if (normalized.includes('3b82f6') || normalized.includes('60a5fa')) return 'dot-glow-blue';
  if (normalized.includes('eab308') || normalized.includes('f59e0b')) return 'dot-glow-yellow';
  if (normalized.includes('a855f7') || normalized.includes('8b5cf6')) return 'dot-glow-purple';
  return 'dot-glow-blue';
};

export const distributionDotClass = (tab: string, label: string) => {
  switch (tab) {
    case 'source':
      return sourceDotClass(label);
    case 'severity':
      return severityDotClass(label);
    case 'remediation':
      return remediationDotClass(label);
    case 'vector':
      return vectorDotClass(label);
    default:
      return 'source-dot-default';
  }
};

export const distributionDotGlowClass = (tab: string, label: string) => {
  if (tab === 'severity') {
    const normalized = label.toLowerCase();
    if (normalized === 'critical') return 'dot-glow-red';
    if (normalized === 'high') return 'dot-glow-orange';
    if (normalized === 'medium') return 'dot-glow-yellow';
    if (normalized === 'low') return 'dot-glow-green';
  }
  return 'dot-glow-blue';
};

export const staggerDelayClass = (index: number) => `stagger-delay-${Math.min(index, 4)}`;

export const revealIndexDelayClass = (index: number) => {
  const delay = Math.min(4, index);
  return `stagger-delay-${delay}`;
};
