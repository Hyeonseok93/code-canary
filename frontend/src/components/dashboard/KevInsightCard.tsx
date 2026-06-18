import { Clock, Bug, Wrench } from 'lucide-react';
import { useVulnerabilityNavigation } from '../../hooks/useVulnerabilityNavigation';
import type { KevInsight } from '../../types/analytics';

import { getSeverityTheme } from '../../utils/severity';
import { revealIndexDelayClass } from '../../utils/chartColorClasses';

interface KevInsightCardProps {
  insight: KevInsight;
  index: number;
}

const KevInsightCard = ({ insight, index }: KevInsightCardProps) => {
  const navigateToVulnerability = useVulnerabilityNavigation();

  const getSeverityTextColor = (score: number) => {
    return getSeverityTheme(score).text;
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays}d ago`;
  };

  const handleCardClick = () => {
    navigateToVulnerability(insight.cveId);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative bg-neutral-900/40 border border-white/[0.14] rounded-2xl p-4 hover:bg-neutral-900/60 hover:border-white/25 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full overflow-hidden animate-reveal cursor-pointer ${revealIndexDelayClass(index)}`}
    >
      {/* Header: ID, Badges, Time */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-black text-neutral-400 font-mono tracking-tight uppercase">
            {insight.cveId}
          </span>
          <div className="flex items-center gap-2">
             {insight.dDay !== null && (
               <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${
                   insight.dDay <= 3 ? 'bg-red-500 text-white border-red-600' : 'bg-white/5 text-neutral-400 border-white/10'
                 }`}>
                   {insight.dDay <= 0 ? 'Overdue' : `D-${insight.dDay}`}
                 </span>
                 <span className="text-[11px] font-black text-neutral-500 uppercase tracking-tight">
                   ~ {new Date(insight.dueDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '')}
                 </span>
               </div>
             )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-neutral-500">
          <Clock size={12} />
          <span className="text-[11px] font-black uppercase tracking-tight">{formatRelativeTime(insight.addedDate)}</span>
        </div>
      </div>

      {/* Body: Title */}
      <h3 className="text-[14px] font-bold text-white leading-tight mb-4 line-clamp-2 min-h-[2.4rem] group-hover:text-blue-400 transition-colors">
        {insight.name}
      </h3>

      {/* Footer Info Section (Score + Meta) */}
      <div className="mt-auto pt-3 border-t border-white/[0.10] flex items-center justify-between gap-4">
        {/* Score on the Left */}
        <div className={`text-2xl font-black tracking-tighter ${getSeverityTextColor(insight.baseScore)}`}>
          {insight.baseScore.toFixed(1)}
        </div>

        {/* Weakness & Remediation on the Right */}
        <div className="flex flex-col items-end min-w-0">
          <div className="flex items-center gap-1.5 text-neutral-400 max-w-full">
            <span className="text-[10px] font-bold uppercase tracking-tight truncate">{insight.weaknessType}</span>
            <Bug size={10} className="flex-shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 max-w-full">
            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${
              insight.remediationStatus === 'Patch Ready' ? 'text-emerald-400' : 'text-neutral-500'
            }`}>
              {insight.remediationStatus}
            </span>
            <Wrench size={10} className="flex-shrink-0 text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KevInsightCard;