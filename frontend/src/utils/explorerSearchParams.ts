import type { ExplorerFilters } from '../types/explorer';

const EXPLORER_FILTER_PARAM_KEYS = [
  'source',
  'vector',
  'status',
  'remediation',
  'pillar',
  'ecosystem',
  'severity',
  'startDate',
  'endDate',
  'isKev',
] as const satisfies readonly (keyof ExplorerFilters)[];

const EXPLORER_URL_FILTER_KEYS = ['search', ...EXPLORER_FILTER_PARAM_KEYS] as const;

function shouldIncludeExplorerFilterValue(value: unknown): boolean {
  return value !== undefined && value !== '' && value !== false && value !== null;
}

export function appendExplorerFiltersToSearchParams(
  params: URLSearchParams,
  filters: ExplorerFilters,
  search?: string
): URLSearchParams {
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  for (const key of EXPLORER_FILTER_PARAM_KEYS) {
    const value = filters[key];
    if (shouldIncludeExplorerFilterValue(value)) {
      params.set(key, value!.toString());
    }
  }

  return params;
}

export function countActiveExplorerFilters(filters: ExplorerFilters, search?: string): number {
  const filterCount = Object.values(filters).filter(shouldIncludeExplorerFilterValue).length;
  return filterCount + (search?.trim() ? 1 : 0);
}

export function parseExplorerFiltersFromParams(params: URLSearchParams): ExplorerFilters {
  return {
    source: params.get('source') || '',
    vector: params.get('vector') || '',
    status: params.get('status') || '',
    remediation: params.get('remediation') || '',
    pillar: params.get('pillar') || '',
    ecosystem: params.get('ecosystem') || '',
    severity: params.get('severity') || '',
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
    isKev: params.get('isKev') === 'true',
  };
}

export function buildExplorerSearchParams(
  search: string,
  filters: ExplorerFilters,
  page = '1'
): Record<string, string> {
  const params: Record<string, string> = { p: page };
  const query = new URLSearchParams();
  appendExplorerFiltersToSearchParams(query, filters, search);

  for (const [key, value] of query.entries()) {
    params[key] = value;
  }

  return params;
}

export function buildExplorerUrl(search: string, filters: ExplorerFilters, page = '1'): string {
  const params = buildExplorerSearchParams(search, filters, page);
  return `/explorer?${new URLSearchParams(params).toString()}`;
}

export function explorerFilterParamsDiffer(
  current: Record<string, string>,
  next: Record<string, string>
): boolean {
  return EXPLORER_URL_FILTER_KEYS.some((key) => (current[key] || '') !== (next[key] || ''));
}
