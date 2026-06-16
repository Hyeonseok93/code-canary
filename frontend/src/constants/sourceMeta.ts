/** Short source codes shared by explorer badges and dashboard charts. */
export const SOURCE_META = {
  NVD: {
    chartLabel: 'Official CVEs (NVD)',
    color: '#3B82F6',
    badgeClasses: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    syncPulseClass: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]',
  },
  OSV: {
    chartLabel: 'Open-Source Intel (OSV)',
    color: '#10B981',
    badgeClasses: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    syncPulseClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
  },
  MAL: {
    chartLabel: 'Malicious Threats (MAL)',
    color: '#F59E0B',
    badgeClasses: 'bg-red-500/10 text-red-400 border-red-500/20',
    syncPulseClass: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]',
  },
} as const;

export type SourceCode = keyof typeof SOURCE_META;

export const SOURCE_COLORS: Record<string, string> = Object.fromEntries(
  Object.values(SOURCE_META).map((meta) => [meta.chartLabel, meta.color])
);

export const EXPLORER_SOURCE_OPTIONS = Object.keys(SOURCE_META) as SourceCode[];
