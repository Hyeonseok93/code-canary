import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import canaryPng from '../../assets/code_canary.png';
import ExplorerFilterPanel from '../explorer/ExplorerFilterPanel';
import { EMPTY_EXPLORER_FILTERS } from '../../constants/explorerFilters';
import { SOURCE_META } from '../../constants/sourceMeta';
import { formatSyncDateTime } from '../../utils/dateTime';
import { buildExplorerUrl } from '../../utils/explorerSearchParams';
import { useExplorerFilterUpdater } from '../../hooks/useExplorerFilters';

interface HeroSectionProps {
  nvdLastUpdatedAt?: string;
  osvLastUpdatedAt?: string;
  isSyncLoading?: boolean;
}

const SyncBadge = ({
  label,
  value,
  pulseClass,
  isLoading,
}: {
  label: string;
  value?: string;
  pulseClass: string;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 whitespace-nowrap">
        <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${pulseClass} opacity-40 animate-pulse`} />
        <span>
          {label} : <span className="text-neutral-600 font-mono">…</span>
        </span>
      </div>
    );
  }

  if (!value) return null;

  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap">
      <div
        className={`w-2.5 h-2.5 shrink-0 rounded-full ${pulseClass} animate-pulse shadow-[0_0_10px_currentColor]`}
      />
      <span>
        {label} :{' '}
        <span className="font-mono text-neutral-300">
          {formatSyncDateTime(value, { withSeconds: true })}
        </span>
      </span>
    </div>
  );
};

const HeroSection = ({
  nvdLastUpdatedAt,
  osvLastUpdatedAt,
  isSyncLoading = false,
}: HeroSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { filters, updateFilter } = useExplorerFilterUpdater({ ...EMPTY_EXPLORER_FILTERS });

  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(buildExplorerUrl(searchQuery, filters));
  };

  return (
    <div
      className={`relative z-30 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-16 lg:gap-24 animate-reveal transition-all duration-300 ${showFilters ? 'mb-[450px] lg:mb-[290px]' : 'mb-32'}`}
    >
      <div className="relative w-44 h-44 md:w-64 md:h-64 flex-shrink-0 group lg:mt-10">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000" />
        <img
          src={canaryPng}
          alt="Code Canary Sentinel"
          className="relative w-full h-full object-contain brightness-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        />
      </div>

      <div className="flex flex-col items-center lg:items-start text-center lg:text-left animate-reveal" style={{ animationDelay: '0.2s' }}>
        <div className="inline-flex items-center justify-center px-3 py-1 bg-white/5 cc-panel-border-soft rounded-full mb-6">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-[0.3em] leading-none">
            Precision Security Analysis
          </span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-[-0.05em] uppercase mb-8 leading-none">
          CODE <span className="text-neutral-500">CANARY</span>
        </h1>
        <div className="mb-10">
          <p className="max-w-xl text-[13px] md:text-[14px] text-neutral-400 font-medium leading-relaxed tracking-wide opacity-90">
            Code Canary aggregates and visualizes real-time vulnerability data from the{' '}
            <span className="text-white border-b border-white/20 pb-0.5 font-bold uppercase">NVD</span> and{' '}
            <span className="text-white border-b border-white/20 pb-0.5 font-bold uppercase">OSV</span> databases,
            providing unified intelligence mapping, weakness analysis, and remediation trend insights.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500 lg:flex-nowrap lg:justify-start lg:gap-x-6">
            <SyncBadge
              label="NVD Sync"
              value={nvdLastUpdatedAt}
              pulseClass={SOURCE_META.NVD.syncPulseClass}
              isLoading={isSyncLoading}
            />
            {(nvdLastUpdatedAt || isSyncLoading) && (osvLastUpdatedAt || isSyncLoading) && (
              <span className="hidden text-neutral-700 lg:inline">|</span>
            )}
            <SyncBadge
              label="OSV Sync"
              value={osvLastUpdatedAt}
              pulseClass={SOURCE_META.OSV.syncPulseClass}
              isLoading={isSyncLoading}
            />
          </div>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-4 relative">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="relative flex-grow group w-full">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search Intelligence Catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-[24px] py-4 pl-14 pr-6 text-[15px] font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all uppercase tracking-tight shadow-2xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 rounded-[24px] border transition-all duration-300 flex items-center gap-2 ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
              >
                <Filter size={20} />
              </button>

              <button
                type="submit"
                className="flex-grow sm:flex-grow-0 bg-white text-black px-8 py-4 rounded-[24px] text-[13px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl"
              >
                Explore
              </button>
            </div>
          </form>

          {showFilters && (
            <ExplorerFilterPanel filters={filters} onFilterChange={updateFilter} variant="hero" />
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
