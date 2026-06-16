interface SeverityDistribution {
  label: string;
  count: number;
  percentage: number;
}

interface AnnualTrend {
  year: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface SourceDistribution {
  label: string;
  count: number;
  percentage: number;
}

interface SourceTrend {
  year: number;
  nvd: number;
  osv: number;
  mal: number;
  total: number;
}

export interface DashboardAnalytics {
  distribution: SeverityDistribution[];
  trend: AnnualTrend[];
  sourceDistribution: SourceDistribution[];
  sourceTrend: SourceTrend[];
  averageScore: number;
}

interface VectorDistribution {
  attackVector: string;
  count: number;
}

interface VectorTrend {
  year: number;
  network: number;
  adjacent: number;
  local: number;
  physical: number;
  total: number;
}

export interface VectorAnalytics {
  distribution: VectorDistribution[];
  trends: VectorTrend[];
}

export interface EcosystemDistribution {
  ecosystem: string;
  count: number;
  percentage: number;
}

export interface EcosystemTrend {
  year: number;
  ecosystem: string;
  count: number;
}

export interface EcosystemAnalytics {
  distribution: EcosystemDistribution[];
  trends: EcosystemTrend[];
}

interface WeaknessPillar {
  pillar: string;
  count: number;
  percentage: number;
}

export interface WeaknessDetail {
  cweId: string;
  name: string;
  pillar: string;
  count: number;
  percentage: number;
}

export interface WeaknessAnalytics {
  pillars: WeaknessPillar[];
  details: WeaknessDetail[];
}

interface RemediationDistribution {
  label: string;
  count: number;
  percentage: number;
}

interface RemediationTrend {
  year: number;
  label: string;
  count: number;
}

export interface RemediationAnalytics {
  distribution: RemediationDistribution[];
  trends: RemediationTrend[];
}

export interface KevInsight {
  cveId: string;
  name: string;
  baseScore: number;
  addedDate: string;
  dueDate: string;
  dDay: number;
  weaknessType: string;
  remediationStatus: string;
}
