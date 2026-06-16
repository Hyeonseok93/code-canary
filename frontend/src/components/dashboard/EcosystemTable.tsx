import { useMemo, type FC } from 'react';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { EcosystemDistribution } from '../../types/analytics';
import { ECOSYSTEM_COLORS } from '../../constants/dashboardConstants';

interface EcosystemTableProps {
  data: EcosystemDistribution[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const EcosystemTable: FC<EcosystemTableProps> = ({ data, isLoading, isError }) => {
  const sortedData = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <div className="bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-visible flex flex-col min-h-[600px] relative">
      <div className="p-8 border-b border-white/[0.14]">
        <DashboardPanelHeader
          title="Ecosystem Distribution"
          accentClassName="bg-blue-500"
          tooltip="Vulnerability count and ratio distribution mapped to specific open-source software package managers and language ecosystems."
          className="mb-0"
        />
      </div>

      <div className="flex-grow flex flex-col">
        {isError ? (
          <ErrorState variant="placeholder" {...DEFAULT_PLACEHOLDER_ERROR} className="flex-grow" />
        ) : isLoading ? (
          <div className="px-8 pt-6 pb-8 space-y-4 flex-grow">
            {/* Header Skeleton */}
            <div className="flex justify-between pb-2 border-b border-white/[0.12]">
              <div className="w-16 h-2 bg-white/5 rounded animate-skeleton" />
              <div className="w-12 h-2 bg-white/5 rounded animate-skeleton" />
              <div className="w-12 h-2 bg-white/5 rounded animate-skeleton" />
            </div>
            {/* Row Skeletons */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/5 animate-skeleton" />
                  <div className="w-24 h-2.5 bg-white/5 rounded animate-skeleton" />
                </div>
                <div className="w-16 h-2.5 bg-white/5 rounded animate-skeleton" />
                <div className="w-10 h-2.5 bg-white/5 rounded animate-skeleton" />
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-white/[0.10]">
                <th className="pl-8 pr-2 py-1 text-[9px] font-black text-neutral-500 uppercase tracking-widest w-[60%]">Ecosystem</th>
                <th className="px-2 py-1 text-[9px] font-black text-neutral-500 uppercase tracking-widest text-right w-[20%]">Count</th>
                <th className="pl-2 pr-8 py-1 text-[9px] font-black text-neutral-500 uppercase tracking-widest text-right w-[20%]">Ratio</th>
              </tr>
            </thead>
            <tbody className="after:content-[''] after:block after:h-4">
              {sortedData.map((item, idx) => (
                <tr 
                  key={item.ecosystem} 
                  className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.08] last:border-0"
                >
                  <td className="pl-8 pr-2 py-0">
                    <div className="flex items-center gap-2.5 overflow-hidden h-6">
                      <div 
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: ECOSYSTEM_COLORS[item.ecosystem] || `hsl(${idx * 137.5 % 360}, 50%, 50%)` }} 
                      />
                      <span className="text-[11px] font-bold text-neutral-300 group-hover:text-white transition-colors truncate whitespace-nowrap">
                        {item.ecosystem}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-0 text-right">
                    <span className="text-[11px] font-black text-white tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                  </td>
                  <td className="pl-2 pr-8 py-0 text-right">
                    <span className="text-[9px] font-black text-neutral-500 tabular-nums">
                      {item.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EcosystemTable;
