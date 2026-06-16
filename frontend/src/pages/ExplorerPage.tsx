import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVulnerabilityNavigation } from '../hooks/useVulnerabilityNavigation';
import MainLayout from '../layouts/MainLayout';
import { useExplorerData } from '../hooks/useExplorer';
import { useExplorerFilterUpdater } from '../hooks/useExplorerFilters';
import ExplorerTable from '../components/explorer/ExplorerTable';
import Pagination from '../components/explorer/Pagination';
import ExplorerFilterPanel from '../components/explorer/ExplorerFilterPanel';
import { EMPTY_EXPLORER_FILTERS } from '../constants/explorerFilters';
import {
  buildExplorerSearchParams,
  countActiveExplorerFilters,
  explorerFilterParamsDiffer,
  parseExplorerFiltersFromParams,
} from '../utils/explorerSearchParams';
import { getAxiosStatus } from '../api/errors';
import { Database, Search, Filter, X } from 'lucide-react';

const ExplorerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigateToVulnerability = useVulnerabilityNavigation();
  const currentPage = parseInt(searchParams.get('p') || '1');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const { filters, setFilters, updateFilter } = useExplorerFilterUpdater(() =>
    parseExplorerFiltersFromParams(searchParams)
  );

  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const currentPageInUrl = searchParams.get('p') || '1';
    const nextParams = buildExplorerSearchParams(debouncedSearch, filters, currentPageInUrl);
    const currentParams = Object.fromEntries(searchParams.entries());

    if (explorerFilterParamsDiffer(currentParams, nextParams)) {
      nextParams.p = '1';
    }

    if (JSON.stringify(nextParams) !== JSON.stringify(currentParams)) {
      setSearchParams(nextParams);
    }
  }, [debouncedSearch, filters, setSearchParams, searchParams]);

  const { data: explorerPage, isLoading, isError, error } = useExplorerData(currentPage, 50, {
    search: debouncedSearch,
    ...filters,
  });
  const errorStatus = getAxiosStatus(error);

  const handlePageChange = (page: number) => {
    const newParams = Object.fromEntries(searchParams.entries());
    newParams.p = page.toString();
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ ...EMPTY_EXPLORER_FILTERS });
    setSearchParams({ p: '1' });
  };

  const activeFilterCount = countActiveExplorerFilters(filters, debouncedSearch);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-reveal">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 cc-panel-border-soft rounded-full">
              <Database size={12} className="text-neutral-500" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                Global Intelligence Feed
              </span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
              Inventory <span className="text-neutral-500">Explorer</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search IDs, descriptions, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-[14px] font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all uppercase tracking-tight"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-300 w-full sm:w-auto justify-center ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
              >
                <Filter size={18} />
                {activeFilterCount > 0 && (
                  <span
                    className={`ml-1 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${showFilters ? 'bg-black text-white' : 'bg-white text-black'}`}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all shrink-0"
                  title="Clear All Filters"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <ExplorerFilterPanel filters={filters} onFilterChange={updateFilter} variant="page" />
        )}

        <div className="relative z-10 min-h-[600px]">
          <ExplorerTable
            items={explorerPage?.items}
            isLoading={isLoading}
            isError={isError}
            errorStatus={errorStatus}
            onItemClick={navigateToVulnerability}
          />
        </div>

        {explorerPage && explorerPage.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={explorerPage.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ExplorerPage;
