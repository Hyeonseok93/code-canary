import { describe, expect, it } from 'vitest';
import {
  appendExplorerFiltersToSearchParams,
  buildExplorerSearchParams,
  countActiveExplorerFilters,
  explorerFilterParamsDiffer,
  parseExplorerFiltersFromParams,
} from './explorerSearchParams';
import { EMPTY_EXPLORER_FILTERS } from '../constants/explorerFilters';

describe('appendExplorerFiltersToSearchParams', () => {
  it('omits empty filters and isKev=false', () => {
    const params = appendExplorerFiltersToSearchParams(
      new URLSearchParams(),
      { ...EMPTY_EXPLORER_FILTERS, source: 'NVD', isKev: false },
      '  '
    );

    expect(params.get('source')).toBe('NVD');
    expect(params.has('isKev')).toBe(false);
    expect(params.has('search')).toBe(false);
  });

  it('includes isKev=true and trimmed search', () => {
    const params = appendExplorerFiltersToSearchParams(
      new URLSearchParams(),
      { ...EMPTY_EXPLORER_FILTERS, isKev: true },
      '  log4j '
    );

    expect(params.get('isKev')).toBe('true');
    expect(params.get('search')).toBe('log4j');
  });
});

describe('countActiveExplorerFilters', () => {
  it('matches append rules including search', () => {
    const filters = { ...EMPTY_EXPLORER_FILTERS, severity: 'Critical', isKev: false };
    expect(countActiveExplorerFilters(filters, '  ')).toBe(1);
    expect(countActiveExplorerFilters(filters, 'x')).toBe(2);
  });
});

describe('parseExplorerFiltersFromParams', () => {
  it('parses isKev only when true', () => {
    expect(parseExplorerFiltersFromParams(new URLSearchParams('isKev=true')).isKev).toBe(true);
    expect(parseExplorerFiltersFromParams(new URLSearchParams('isKev=false')).isKev).toBe(false);
    expect(parseExplorerFiltersFromParams(new URLSearchParams()).isKev).toBe(false);
  });
});

describe('buildExplorerSearchParams', () => {
  it('builds page and filter params together', () => {
    const params = buildExplorerSearchParams('test', { ...EMPTY_EXPLORER_FILTERS, vector: 'Network' }, '2');
    expect(params).toEqual({ p: '2', search: 'test', vector: 'Network' });
  });
});

describe('explorerFilterParamsDiffer', () => {
  it('detects search and filter changes', () => {
    expect(explorerFilterParamsDiffer({ search: 'a' }, { search: 'b' })).toBe(true);
    expect(explorerFilterParamsDiffer({ source: 'NVD' }, { source: 'NVD', search: '' })).toBe(false);
  });
});
