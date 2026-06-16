export interface ExplorerItem {
  vulnId: string;
  source: string;
  baseScore: number;
  publishedDate: string;
  summary: string;
  status: string;
  attackVector: string;
  remediationStatus: string;
  weaknessPillar: string;
  ecosystems: string;
  isKev: boolean;
  kevDueDate: string | null;
}

export interface ExplorerPageResponse {
  items: ExplorerItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface ExplorerFilters {
  search?: string;
  source?: string;
  vector?: string;
  status?: string;
  remediation?: string;
  pillar?: string;
  ecosystem?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  isKev?: boolean;
}

interface NvdDetail {
  cvssVersion: string | null;
  cvssVector: string | null;
  exploitabilityScore: number | null;
  impactScore: number | null;
  cpeConfigurations: unknown;
}

interface OsvAffectedPackage {
  packageName: string;
  ecosystem: string;
  purl: string | null;
  ranges: unknown;
  versions: unknown;
  severity: unknown;
  databaseSpecific: unknown;
  ecosystemSpecific: unknown;
}

interface OsvDetail {
  affected: OsvAffectedPackage[];
}

interface VulnerabilityReference {
  url: string;
  sourceOrType: string;
  tags: unknown;
}

interface VulnerabilityAlias {
  idType: string;
  targetId: string;
}

interface VulnerabilityCredit {
  name: string;
  type: string;
}

interface VulnerabilityVendorComment {
  organization: string;
  comment: string;
  lastModified: string | null;
}

export interface VulnerabilityDetailResponse {
  vulnId: string;
  source: string;
  baseScore: number;
  severity: string;
  publishedDate: string | null;
  modifiedDate: string | null;
  summary: string;
  description: string;
  status: string;
  attackVector: string | null;
  weaknessPillar: string | null;
  ecosystems: string | null;
  isKev: boolean;
  kevDueDate: string | null;
  kevRequiredAction: string | null;
  cweId: string | null;
  cweName: string | null;
  references: VulnerabilityReference[];
  aliases: VulnerabilityAlias[];
  credits: VulnerabilityCredit[];
  vendorComments: VulnerabilityVendorComment[];
  nvdDetails: NvdDetail | null;
  osvDetails: OsvDetail | null;
}

export interface AdminProfile {
  username: string;
  role: string;
}

export interface AdminSession {
  authenticated: boolean;
  username: string | null;
  role: string | null;
}
