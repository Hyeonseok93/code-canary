import type { ReactNode } from 'react';
import DashboardHelpTooltip from './DashboardHelpTooltip';

interface MetricCardProps {
  label: string;
  value: string | number | undefined;
  icon: ReactNode;
  colorClass: string;
  glowClass: string;
  isLoading?: boolean;
  isError?: boolean;
  description?: string;
}

const MetricCard = ({
  label,
  value,
  icon,
  colorClass,
  glowClass,
  isLoading,
  isError,
  description,
}: MetricCardProps) => {
  return (
    <div className="bg-neutral-900/40 border border-white/[0.14] p-5 rounded-[20px] hover:bg-neutral-900/60 hover:border-white/25 transition-all duration-500 group relative overflow-visible flex items-center gap-5">
      {/* Tooltip Icon & Box */}
      {description && (
        <DashboardHelpTooltip
          description={description}
          popupAlign="right"
          className="absolute top-3 right-3 z-30"
        />
      )}

      {/* Icon Section */}
      <div className={`p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.12] ${colorClass} ${glowClass} transition-all duration-500 flex-shrink-0 ${isLoading ? 'opacity-20 grayscale animate-skeleton' : ''}`}>
        {icon}
      </div>

      {/* Content Section */}
      <div className="flex flex-col min-w-0 flex-grow">
        <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.1em] mb-1 transition-colors group-hover:text-neutral-300 truncate">
          {label}
        </div>
        
        <div className="h-8 flex items-center">
          {isLoading ? (
            <div className="w-24 h-6 bg-white rounded-md animate-skeleton" />
          ) : isError ? (
            <span className="text-red-900/50 text-xl font-bold uppercase tracking-tighter">Err</span>
          ) : (
            <div className="text-3xl font-black text-white tracking-tighter leading-none">
              {value ?? '0'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;