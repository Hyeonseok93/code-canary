import { useKevInsights } from '../../hooks/useDashboardAnalytics';
import KevInsightCard from './KevInsightCard';
import ErrorState from '../common/ErrorState';
import EmptyState from './EmptyState';

const KevIntelligenceGrid = () => {
  const { data: insights, isLoading, isError } = useKevInsights();

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 px-2 animate-reveal">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
          Known Exploited <span className="text-neutral-500">Vulnerabilities</span>
        </h2>
      </div>

      {!isLoading && !isError && insights && insights.length > 0 && (
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-neutral-900/40 border border-white/10 rounded-full text-neutral-400 w-fit backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)] animate-reveal reveal-delay-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500/50 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
          </span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] leading-none">
            Showing Top 12 <span className="hidden sm:inline">Recent</span> Entries
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-20">
      {renderHeader()}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-skeleton shadow-lg" 
            />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-hidden relative">
          <ErrorState
            variant="placeholder"
            title="Intelligence Feed Unavailable"
            message="We're having trouble connecting to the KEV intelligence stream. Please try again later."
            className="py-20"
          />
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(insights?.slice(0, 12) || []).map((insight, index) => (
            <KevInsightCard key={insight.cveId} insight={insight} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-hidden relative">
          <EmptyState 
            title="No Exploits Detected"
            message="The KEV catalog is currently clear or no matching records were found. Check back later for updates."
            className="py-20"
          />
        </div>
      )}
    </div>
  );
};
export default KevIntelligenceGrid;