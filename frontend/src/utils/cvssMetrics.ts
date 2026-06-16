import type { LucideIcon } from 'lucide-react';
import { Globe, Lock, Shield, User, Zap } from 'lucide-react';
import {
  type CvssVersion,
  normalizeCvssVersion,
  parseCvssVectorParts,
} from './cvssVector';

export type { CvssVersion };

export type MetricSeverity = 'critical' | 'high' | 'medium' | 'low' | 'neutral';

export interface CvssMetricCardData {
  label: string;
  value: string;
  desc: string;
  severity: MetricSeverity;
  icon: LucideIcon;
  /** Vector omits this metric entirely (distinct from CVSS value N / None). */
  missing?: boolean;
}

export interface CvssMetricGroupData {
  title: string;
  metrics: CvssMetricCardData[];
}

const SEVERITY_STYLES: Record<
  MetricSeverity,
  { text: string; bg: string; border: string; glow: string }
> = {
  critical: {
    text: 'text-red-500',
    bg: 'bg-red-500/5',
    border: 'group-hover/card:border-red-500/30',
    glow: 'group-hover/card:shadow-[0_0_25px_rgba(239,68,68,0.2)]',
  },
  high: {
    text: 'text-orange-500',
    bg: 'bg-orange-500/5',
    border: 'group-hover/card:border-orange-500/30',
    glow: 'group-hover/card:shadow-[0_0_25px_rgba(249,115,22,0.2)]',
  },
  medium: {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/5',
    border: 'group-hover/card:border-yellow-500/30',
    glow: 'group-hover/card:shadow-[0_0_25px_rgba(234,179,8,0.2)]',
  },
  low: {
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/5',
    border: 'group-hover/card:border-emerald-500/30',
    glow: 'group-hover/card:shadow-[0_0_25px_rgba(16,185,129,0.2)]',
  },
  neutral: {
    text: 'text-neutral-400',
    bg: 'bg-neutral-500/5',
    border: 'group-hover/card:border-neutral-500/30',
    glow: 'group-hover/card:shadow-[0_0_20px_rgba(163,163,163,0.1)]',
  },
};

export function getMetricSeverityStyles(severity: MetricSeverity) {
  return SEVERITY_STYLES[severity];
}

type MetricDef = {
  label: string;
  icon: LucideIcon;
  values: Record<string, { value: string; desc: string; severity: MetricSeverity }>;
};

const METRICS: Record<string, MetricDef> = {
  AV: {
    label: 'Attack Vector',
    icon: Globe,
    values: {
      N: { value: 'Network', desc: 'Exploitable from a remote network.', severity: 'critical' },
      A: { value: 'Adjacent', desc: 'Requires adjacent network access.', severity: 'high' },
      L: { value: 'Local', desc: 'Requires local access to the system.', severity: 'medium' },
      P: { value: 'Physical', desc: 'Requires physical access to the device.', severity: 'low' },
    },
  },
  AC: {
    label: 'Complexity',
    icon: Zap,
    values: {
      L: { value: 'Low', desc: 'No special conditions; easy to exploit repeatedly.', severity: 'critical' },
      H: { value: 'High', desc: 'Requires timing, bypass steps, or special conditions.', severity: 'low' },
      M: { value: 'Medium', desc: 'Some access complexity beyond a simple attack.', severity: 'medium' },
    },
  },
  AT: {
    label: 'Attack Requirements',
    icon: Zap,
    values: {
      N: { value: 'None', desc: 'No deployment or execution preconditions.', severity: 'critical' },
      P: { value: 'Present', desc: 'Specific target configuration or state is required.', severity: 'low' },
    },
  },
  PR: {
    label: 'Privileges',
    icon: Lock,
    values: {
      N: { value: 'None', desc: 'No authentication or privileges required.', severity: 'critical' },
      L: { value: 'Low', desc: 'Requires basic user-level privileges.', severity: 'high' },
      H: { value: 'High', desc: 'Requires admin or elevated privileges.', severity: 'low' },
    },
  },
  UI: {
    label: 'User Interaction',
    icon: User,
    values: {
      N: { value: 'None', desc: 'No user interaction required to exploit.', severity: 'critical' },
      R: { value: 'Required', desc: 'Victim must perform an action (CVSS 3.x).', severity: 'low' },
      P: { value: 'Passive', desc: 'Passive user involvement only (CVSS 4.0).', severity: 'low' },
      A: { value: 'Active', desc: 'Victim must actively engage (click, open, etc.) — CVSS 4.0.', severity: 'low' },
    },
  },
  Au: {
    label: 'Authentication',
    icon: Lock,
    values: {
      N: { value: 'None', desc: 'No authentication required.', severity: 'critical' },
      S: { value: 'Single', desc: 'Single instance authentication required.', severity: 'high' },
      M: { value: 'Multiple', desc: 'Multiple authentications required.', severity: 'low' },
    },
  },
  S: {
    label: 'Scope',
    icon: Shield,
    values: {
      U: { value: 'Unchanged', desc: 'Impact stays within the same security authority.', severity: 'low' },
      C: { value: 'Changed', desc: 'Impact crosses into another security authority.', severity: 'critical' },
    },
  },
  C: {
    label: 'Confidentiality',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'Total information disclosure.', severity: 'critical' },
      L: { value: 'Low', desc: 'Limited information disclosure.', severity: 'medium' },
      N: { value: 'None', desc: 'No confidentiality impact.', severity: 'low' },
      P: { value: 'Partial', desc: 'Partial information disclosure (CVSS 2.0).', severity: 'high' },
      C: { value: 'Complete', desc: 'Complete information disclosure (CVSS 2.0).', severity: 'critical' },
    },
  },
  I: {
    label: 'Integrity',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'Total compromise of integrity.', severity: 'critical' },
      L: { value: 'Low', desc: 'Limited integrity compromise.', severity: 'medium' },
      N: { value: 'None', desc: 'No integrity impact.', severity: 'low' },
      P: { value: 'Partial', desc: 'Partial integrity compromise (CVSS 2.0).', severity: 'high' },
      C: { value: 'Complete', desc: 'Complete integrity compromise (CVSS 2.0).', severity: 'critical' },
    },
  },
  A: {
    label: 'Availability',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'Total loss of availability.', severity: 'critical' },
      L: { value: 'Low', desc: 'Reduced performance or partial outage.', severity: 'medium' },
      N: { value: 'None', desc: 'No availability impact.', severity: 'low' },
      P: { value: 'Partial', desc: 'Partial availability impact (CVSS 2.0).', severity: 'high' },
      C: { value: 'Complete', desc: 'Complete loss of availability (CVSS 2.0).', severity: 'critical' },
    },
  },
  VC: {
    label: 'Confidentiality',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on vulnerable system confidentiality.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on vulnerable system confidentiality.', severity: 'medium' },
      N: { value: 'None', desc: 'No confidentiality impact on vulnerable system.', severity: 'low' },
    },
  },
  VI: {
    label: 'Integrity',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on vulnerable system integrity.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on vulnerable system integrity.', severity: 'medium' },
      N: { value: 'None', desc: 'No integrity impact on vulnerable system.', severity: 'low' },
    },
  },
  VA: {
    label: 'Availability',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on vulnerable system availability.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on vulnerable system availability.', severity: 'medium' },
      N: { value: 'None', desc: 'No availability impact on vulnerable system.', severity: 'low' },
    },
  },
  SC: {
    label: 'Confidentiality',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on subsequent system confidentiality.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on subsequent system confidentiality.', severity: 'medium' },
      N: { value: 'None', desc: 'No subsequent confidentiality impact.', severity: 'low' },
    },
  },
  SI: {
    label: 'Integrity',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on subsequent system integrity.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on subsequent system integrity.', severity: 'medium' },
      N: { value: 'None', desc: 'No subsequent integrity impact.', severity: 'low' },
    },
  },
  SA: {
    label: 'Availability',
    icon: Shield,
    values: {
      H: { value: 'High', desc: 'High impact on subsequent system availability.', severity: 'critical' },
      L: { value: 'Low', desc: 'Low impact on subsequent system availability.', severity: 'medium' },
      N: { value: 'None', desc: 'No subsequent availability impact.', severity: 'low' },
    },
  },
};

function resolveMetric(key: string, raw: string | undefined): CvssMetricCardData {
  const def = METRICS[key];
  if (!def) {
    return {
      label: key,
      value: '—',
      desc: 'Unknown metric key in CVSS vector.',
      severity: 'neutral',
      icon: Shield,
      missing: true,
    };
  }
  if (!raw) {
    return {
      label: def.label,
      value: '—',
      desc: 'Not included in this CVSS vector.',
      severity: 'neutral',
      icon: def.icon,
      missing: true,
    };
  }
  const entry = def.values[raw.toUpperCase()] ?? def.values[raw];
  if (!entry) {
    return {
      label: def.label,
      value: raw,
      desc: 'Metric value from CVSS vector.',
      severity: 'neutral',
      icon: def.icon,
    };
  }
  return { label: def.label, ...entry, icon: def.icon };
}

function buildGroup(title: string, keys: string[], parts: Record<string, string>): CvssMetricGroupData {
  return {
    title,
    metrics: keys.map((key) => resolveMetric(key, parts[key])),
  };
}

export function resolveCvssVersion(
  rawVersion: string | null | undefined,
  vector: string | null | undefined,
): CvssVersion | null {
  const normalized = normalizeCvssVersion(rawVersion);
  if (normalized === '2.0' || normalized === '3.0' || normalized === '3.1' || normalized === '4.0') {
    return normalized;
  }

  const parts = parseCvssVectorParts(vector);
  if (vector?.includes('CVSS:4.0') || 'VC' in parts) return '4.0';
  if ('Au' in parts) return '2.0';
  if ('S' in parts || ('PR' in parts && !('VC' in parts))) return '3.1';
  return normalized;
}

export function buildCvssMetricGroups(
  version: CvssVersion | null,
  vector: string | null | undefined,
): CvssMetricGroupData[] {
  if (!version || !vector) return [];

  const parts = parseCvssVectorParts(vector);

  switch (version) {
    case '4.0': {
      return [
        buildGroup('Attack Context', ['AV', 'AC', 'AT', 'PR', 'UI'], parts),
        buildGroup('Vulnerable System', ['VC', 'VI', 'VA'], parts),
        buildGroup('Subsequent System', ['SC', 'SI', 'SA'], parts),
      ];
    }
    case '3.0':
    case '3.1': {
      return [
        buildGroup('Attack Context', ['AV', 'AC', 'PR', 'UI', 'S'], parts),
        buildGroup('Impact', ['C', 'I', 'A'], parts),
      ];
    }
    case '2.0': {
      return [
        buildGroup('Access', ['AV', 'AC', 'Au'], parts),
        buildGroup('Impact', ['C', 'I', 'A'], parts),
      ];
    }
    default:
      return [];
  }
}

export function getMetricGroupGridClass(
  version: CvssVersion | null,
  groupTitle: string,
): string {
  const equalCols = (n: number) =>
    `grid gap-4 [grid-template-columns:repeat(${n},minmax(0,1fr))]`;

  if (version === '2.0') {
    return `${equalCols(3)} grid-cols-1 sm:grid-cols-3`;
  }
  if (version === '3.0' || version === '3.1') {
    if (groupTitle === 'Impact') {
      return `${equalCols(3)} grid-cols-1 sm:grid-cols-3`;
    }
    return `${equalCols(5)} grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`;
  }
  if (groupTitle === 'Intelligence Overview') {
    return `${equalCols(3)} grid-cols-1 sm:grid-cols-3 w-full`;
  }
  if (version === '4.0') {
    if (groupTitle === 'Attack Context') {
      return `${equalCols(5)} grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`;
    }
    return `${equalCols(3)} grid-cols-1 sm:grid-cols-3`;
  }
  return 'grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4';
}

const HEADER_GROUP_TITLES = new Set(['Vulnerable System', 'Subsequent System']);

export function splitMetricGroupsForLayout(
  version: CvssVersion | null,
  groups: CvssMetricGroupData[],
): { headerGroups: CvssMetricGroupData[]; bodyGroups: CvssMetricGroupData[] } {
  if (version !== '4.0') {
    return { headerGroups: [], bodyGroups: groups };
  }
  return {
    headerGroups: groups.filter((g) => HEADER_GROUP_TITLES.has(g.title)),
    bodyGroups: groups.filter((g) => !HEADER_GROUP_TITLES.has(g.title)),
  };
}

export function getCvssVersionBadgeClass(version: CvssVersion | null): string {
  switch (version) {
    case '4.0':
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
    case '3.1':
    case '3.0':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    case '2.0':
      return 'text-neutral-400 border-neutral-500/30 bg-neutral-500/5';
    default:
      return 'text-neutral-400 border-neutral-500/30 bg-neutral-500/5';
  }
}
