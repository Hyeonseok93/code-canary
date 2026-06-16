import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { DashboardTab } from './AnalyticsTabs';
import type { DashboardAnalytics, VectorAnalytics } from '../../types/analytics';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

interface TrendTimelineProps {
  activeTab: DashboardTab;
  analyticsData: DashboardAnalytics | undefined;
  vectorData: VectorAnalytics | undefined;
  isLoading?: boolean;
  isVectorLoading?: boolean;
  isError?: boolean;
}

const TrendTimeline = ({
  activeTab,
  analyticsData,
  vectorData,
  isLoading: isAnalyticsLoading,
  isVectorLoading,
  isError,
}: TrendTimelineProps) => {
  const getTooltipDescription = () => {
    switch (activeTab) {
      case 'source':
        return 'Historical growth trend of vulnerabilities added from NVD, OSV, and malware databases. Malware (MAL) advisories are originally part of OSV but are isolated here as a separate track.';
      case 'severity':
        return 'Historical timeline of vulnerability publication volume grouped by their CVSS severity rating.';
      default:
        return 'Vulnerability publication volume over time grouped by the required CVSS attack vector.';
    }
  };

  const processedVectorTrends = useMemo(() => {
    if (!vectorData?.trends) return [];
    return [...vectorData.trends].sort((a, b) => a.year - b.year);
  }, [vectorData]);

  const currentTrendData = useMemo(() => {
    const data = activeTab === 'source' 
      ? analyticsData?.sourceTrend 
      : activeTab === 'severity' 
      ? analyticsData?.trend 
      : processedVectorTrends;
    
    return (data?.slice(-15) || []) as unknown as Record<string, number | string>[];
  }, [activeTab, analyticsData, processedVectorTrends]);

  const isLoading = useMemo(() => {
    if (activeTab === 'vector') return isVectorLoading;
    return isAnalyticsLoading;
  }, [activeTab, isAnalyticsLoading, isVectorLoading]);

  const dataReady = !isLoading && !isError && currentTrendData.length > 0;
  const { containerRef, dimensions, isReady } = useContainerDimensions({
    dataReady,
    readyDelayMs: 200,
  });

  const timelineTitle =
    activeTab === 'source'
      ? 'Multi-Source Intel Growth'
      : activeTab === 'severity'
        ? 'Vulnerability Inflow Timeline'
        : 'Attack Vector Evolution';

  const timelineAccent =
    activeTab === 'source' ? 'bg-indigo-500' : activeTab === 'severity' ? 'bg-blue-500' : 'bg-emerald-500';

  const legendItems =
    activeTab === 'source'
      ? [
          { label: 'Total', color: '#6366F1' },
          { label: 'NVD', color: '#3B82F6' },
          { label: 'OSV', color: '#10B981' },
          { label: 'MAL', color: '#F59E0B' },
        ]
      : activeTab === 'severity'
        ? [
            { label: 'Total', color: '#3B82F6' },
            { label: 'Critical', color: '#EF4444' },
            { label: 'High', color: '#F97316' },
            { label: 'Medium', color: '#EAB308' },
            { label: 'Low', color: '#22C55E' },
          ]
        : [
            { label: 'Network', color: '#3B82F6' },
            { label: 'Adjacent', color: '#10B981' },
            { label: 'Local', color: '#F59E0B' },
            { label: 'Physical', color: '#EF4444' },
          ];

  return (
    <div className="lg:col-span-2 bg-neutral-900/40 border border-white/[0.14] p-8 rounded-[32px] h-[480px] flex flex-col relative overflow-visible min-w-0 min-h-0">
      <DashboardPanelHeader
        title={timelineTitle}
        accentClassName={timelineAccent}
        tooltip={getTooltipDescription()}
        trailing={
          <div className="flex flex-wrap gap-3 justify-end">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5 animate-skeleton">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <div className="w-8 h-2 bg-white/10 rounded" />
                  </div>
                ))
              : legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[8px] font-bold text-neutral-500 uppercase">{item.label}</span>
                  </div>
                ))}
          </div>
        }
      />

      {isError ? (
        <ErrorState variant="placeholder" {...DEFAULT_PLACEHOLDER_ERROR} className="flex-grow" />
      ) : (
        <div className="flex-grow min-w-0 min-h-0 relative" ref={containerRef}>
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8">
              <div className="flex-grow border-b border-dashed border-white/[0.12] relative overflow-hidden">
                {/* Skeleton grid lines */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="absolute w-full border-t border-dashed border-white/[0.12]" style={{ top: `${i * 20}%` }} />
                ))}
                {/* Skeleton area path */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/5 to-transparent animate-skeleton" style={{ clipPath: 'polygon(0 100%, 10% 80%, 25% 90%, 40% 60%, 55% 75%, 75% 40%, 90% 50%, 100% 20%, 100% 100%)' }} />
              </div>
              <div className="flex justify-between mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-8 h-2 bg-white/5 rounded animate-skeleton" />
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0">
              {!isReady || dimensions.width <= 0 || dimensions.height <= 0 ? (
                <div className="w-full h-full" />
              ) : (
                <div className="h-full w-full animate-reveal">
                  <AreaChart width={dimensions.width} height={dimensions.height} data={currentTrendData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSource" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVector" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                    />
                     <Tooltip 
                       content={({ active, payload, label }) => {
                         if (active && payload && payload.length) {
                           return (
                             <div className="bg-neutral-950/90 border border-white/10 p-4 rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.6)] backdrop-blur-md animate-reveal flex flex-col gap-2 min-w-[160px] z-50">
                               <div className="border-b border-white/[0.12] pb-1.5 mb-1">
                                 <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Timeline Year</span>
                                 <h4 className="text-[13px] font-black text-white font-mono mt-0.5">{label}</h4>
                               </div>
                               <div className="space-y-1.5">
                                 {payload.map((series, sIdx) => {
                                   const entry = series as {
                                     dataKey?: string | number;
                                     name?: string;
                                     value?: number;
                                     stroke?: string;
                                     color?: string;
                                   };
                                   if (entry.dataKey === 'total') return null;
                                   return (
                                     <div key={sIdx} className="flex items-center justify-between gap-6">
                                       <div className="flex items-center gap-2">
                                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.color, boxShadow: `0 0 6px ${entry.stroke || entry.color}` }} />
                                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">{entry.name}</span>
                                       </div>
                                       <span className="text-xs font-black text-white font-mono">{entry.value?.toLocaleString()}</span>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                    
                    {activeTab === 'source' ? (
                      <>
                        <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorSource)" />
                        <Line type="monotone" dataKey="nvd" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="osv" stroke="#10B981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="mal" stroke="#F59E0B" strokeWidth={2} dot={false} />
                      </>
                    ) : activeTab === 'severity' ? (
                      <>
                        <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                        <Line type="monotone" dataKey="critical" stroke="#EF4444" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="high" stroke="#F97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="medium" stroke="#EAB308" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="low" stroke="#22C55E" strokeWidth={2} dot={false} />
                      </>
                    ) : (
                      <>
                        <Area type="monotone" dataKey="network" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVector)" />
                        <Area type="monotone" dataKey="adjacent" stroke="#10B981" strokeWidth={2} fill="none" />
                        <Area type="monotone" dataKey="local" stroke="#F59E0B" strokeWidth={2} fill="none" />
                        <Area type="monotone" dataKey="physical" stroke="#EF4444" strokeWidth={2} fill="none" />
                      </>
                    )}
                  </AreaChart>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendTimeline;