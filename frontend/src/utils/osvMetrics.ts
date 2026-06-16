import { Activity, Layers, Zap } from 'lucide-react';
import type { CvssMetricCardData, CvssMetricGroupData, MetricSeverity } from './cvssMetrics';
import type { VulnerabilityDetailResponse } from '../types/explorer';

function isMissingValue(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase().trim();
  return lower === 'unknown' || lower === 'n/a' || lower === 'none' || lower === 'not specified';
}

function resolveStatusSeverity(status: string): MetricSeverity {
  const lower = status.toLowerCase();
  if (lower === 'rejected' || lower === 'withdrawn') return 'high';
  if (lower === 'active') return 'low';
  return 'neutral';
}

function resolveVectorSeverity(vector: string): MetricSeverity {
  const upper = vector.toUpperCase();
  if (upper.includes('NETWORK')) return 'critical';
  if (upper.includes('ADJACENT')) return 'high';
  if (upper.includes('LOCAL')) return 'medium';
  if (upper.includes('PHYSICAL')) return 'low';
  return 'neutral';
}

function buildMetricCard(
  label: string,
  rawValue: string | null | undefined,
  desc: string,
  icon: CvssMetricCardData['icon'],
  severityWhenPresent: MetricSeverity,
): CvssMetricCardData {
  const missing = isMissingValue(rawValue);
  return {
    label,
    value: missing ? '—' : rawValue!.trim(),
    desc: missing ? 'No data available for this field.' : desc,
    severity: missing ? 'neutral' : severityWhenPresent,
    icon,
    missing,
  };
}

export function buildOsvMetricGroups(data: VulnerabilityDetailResponse): CvssMetricGroupData[] {
  return [
    {
      title: 'Intelligence Overview',
      metrics: [
        buildMetricCard(
          'Status',
          data.status,
          'Current lifecycle state of this advisory record.',
          Activity,
          resolveStatusSeverity(data.status || ''),
        ),
        buildMetricCard(
          'Vector',
          data.attackVector,
          'Primary attack vector derived from CVSS or OSV severity data.',
          Zap,
          data.attackVector ? resolveVectorSeverity(data.attackVector) : 'neutral',
        ),
        buildMetricCard(
          'Weakness',
          data.weaknessPillar,
          'CWE weakness category mapped to a security pillar.',
          Layers,
          'neutral',
        ),
      ],
    },
  ];
}
