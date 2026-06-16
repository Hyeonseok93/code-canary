import { Calendar, Activity, Zap, ShieldCheck, Layers, Box, type LucideIcon } from 'lucide-react';
import type { ExplorerItem } from '../../types/explorer';
import SourceBadge from '../common/SourceBadge';
import ErrorState from '../common/ErrorState';
import EmptyState from '../dashboard/EmptyState';
import KevBadge from './KevBadge';
import { getSeverityTheme } from '../../utils/severity';
import { resolveExplorerListError } from '../../utils/explorerErrors';
import { formatVulnDate } from '../../utils/dateTime';

interface ExplorerTableProps {
  items: ExplorerItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorStatus?: number;
  onItemClick?: (vulnId: string) => void;
}

const ExplorerTable = ({ items, isLoading, isError, errorStatus, onItemClick }: ExplorerTableProps) => {
  const getSeverityColor = (score: number) => {
    if (score === 0) return 'border-neutral-800 text-neutral-600 bg-neutral-900/50';
    return getSeverityTheme(score).combinedClass;
  };

  const MetadataBadge = ({ icon: Icon, label, value, colorClass }: { icon: LucideIcon, label: string, value: string | undefined, colorClass: string }) => {
    const lowerValue = value?.toLowerCase();
    const isMissing = !value || 
                      lowerValue === 'unknown' || 
                      lowerValue === 'n/a' || 
                      lowerValue === 'none';
    
    return (
      <div className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-2xl border text-[9px] font-bold uppercase tracking-tight transition-all duration-300 flex-1 min-w-0 ${isMissing ? 'opacity-30 grayscale border-dashed border-white/10' : `${colorClass} hover:border-white/30`}`}>
        <div className="flex items-center gap-1.5 opacity-50">
          <Icon size={10} strokeWidth={2.5} />
          <span className="text-[7px] tracking-[0.1em]">{label}</span>
        </div>
        <span className="truncate w-full text-center font-black tracking-tight px-1">
          {isMissing ? 'Not Specified' : value}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 gap-4 animate-reveal">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 w-full bg-white/5 rounded-[32px] animate-skeleton cc-panel-border-soft" />
        ))}
      </div>
    );
  }

  if (isError) {
    const { title, message } = resolveExplorerListError(errorStatus);
    return (
      <div className="w-full bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-hidden relative">
        <ErrorState variant="placeholder" title={title} message={message} className="py-24" />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-hidden relative">
        <EmptyState 
          title="Catalog Empty"
          message="No security intelligence records found. Please check your data source or search criteria."
          className="py-24"
        />
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 gap-4 animate-reveal">
      {items.map((item) => (
        <div 
          key={item.vulnId} 
          onClick={() => onItemClick?.(item.vulnId)}
          className="group relative bg-neutral-900/40 border border-white/[0.14] hover:bg-neutral-900/60 hover:border-white/30 rounded-[32px] px-6 py-5 md:py-6 transition-all duration-500 overflow-hidden cursor-pointer"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/[0.02] rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-4">
            {/* 1. Header Row: Source, ID, Date & Mobile CVSS */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 flex-grow min-w-0">
                {/* Source & Date (Mobile sub-row) */}
                <div className="flex items-center gap-2 shrink-0">
                  <SourceBadge source={item.source} compact />
                  <div className="flex items-center gap-1.5 text-neutral-500 md:hidden">
                    <Calendar size={12} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {formatVulnDate(item.publishedDate)}
                    </span>
                  </div>
                  {/* Mobile KEV Tag */}
                  {item.isKev && <KevBadge variant="compact" />}
                </div>

                {/* Vulnerability ID - Higher position, more space */}
                <h3 className="text-lg md:text-2xl font-black text-white font-mono tracking-tight uppercase truncate leading-none pr-2">
                  {item.vulnId}
                </h3>

                {/* Desktop Date & KEV Intel */}
                <div className="hidden md:flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <Calendar size={14} />
                    <span className="text-[14px] font-bold uppercase tracking-wider">
                      {formatVulnDate(item.publishedDate)}
                    </span>
                  </div>

                  {/* KEV Intelligence Badge (Desktop) */}
                  {item.isKev && <KevBadge dueDate={item.kevDueDate} />}
                </div>
              </div>

              {/* 2. Mobile CVSS Score (Hidden on md+) */}
              <div className="md:hidden shrink-0">
                <div className={`w-12 h-12 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${getSeverityColor(item.baseScore)}`}>
                  <span className="text-base font-black tracking-tighter leading-none">
                    {item.baseScore > 0 ? item.baseScore.toFixed(1) : '—'}
                  </span>
                  <span className="text-[6px] font-black uppercase tracking-widest opacity-50 mt-0.5">CVSS</span>
                </div>
              </div>
            </div>

            {/* 3. Summary & Metadata Section */}
            <div className="flex flex-col gap-4 w-full">
              <p className="text-[13px] md:text-[14px] text-neutral-400 font-medium leading-relaxed group-hover:text-neutral-200 transition-colors line-clamp-2">
                {item.summary || 'No detailed description available for this security intelligence record. The system is awaiting further enrichment from the sentinel network.'}
              </p>

              {/* Metadata Row: CVSS(Left) + Badges */}
              <div className="flex flex-row items-center gap-2.5 w-full overflow-visible p-1 -m-1">
                {/* 4. Desktop CVSS Score Section (Now on the Left & Square) */}
                <div className="hidden md:flex flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${getSeverityColor(item.baseScore)}`}>
                    <span className="text-xl font-black tracking-tighter leading-none">
                      {item.baseScore > 0 ? item.baseScore.toFixed(1) : '—'}
                    </span>
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-50 mt-1">CVSS</span>
                  </div>
                </div>

                <MetadataBadge 
                  icon={Activity} 
                  label="Status" 
                  value={item.status} 
                  colorClass="text-blue-400 border-blue-400/20 bg-blue-400/5"
                />
                <MetadataBadge 
                  icon={Zap} 
                  label="Vector" 
                  value={item.attackVector} 
                  colorClass="text-orange-400 border-orange-400/20 bg-orange-400/5"
                />
                <MetadataBadge 
                  icon={ShieldCheck} 
                  label="Remediation" 
                  value={item.remediationStatus} 
                  colorClass="text-emerald-400 border-emerald-400/20 bg-emerald-400/5"
                />
                <MetadataBadge 
                  icon={Layers} 
                  label="Weakness" 
                  value={item.weaknessPillar} 
                  colorClass="text-indigo-400 border-indigo-400/20 bg-indigo-400/5"
                />
                <MetadataBadge 
                  icon={Box} 
                  label="Ecosystem" 
                  value={item.ecosystems} 
                  colorClass="text-pink-400 border-pink-400/20 bg-pink-400/5"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExplorerTable;
