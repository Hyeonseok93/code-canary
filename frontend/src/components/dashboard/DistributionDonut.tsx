import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { DashboardTab } from './AnalyticsTabs';
import type { DashboardAnalytics, VectorAnalytics, RemediationAnalytics } from '../../types/analytics';
import { SEVERITY_COLORS, VECTOR_COLORS, SOURCE_COLORS, REMEDIATION_COLORS, SEVERITY_ORDER } from '../../constants/dashboardConstants';
import { distributionDotClass, distributionDotGlowClass, severityDotClass, sourceDotClass, remediationDotClass, vectorDotClass } from '../../utils/chartColorClasses';

interface DistributionDonutProps {
  activeTab: DashboardTab;
  analyticsData: DashboardAnalytics | undefined;
  vectorData: VectorAnalytics | undefined;
  remediationData: RemediationAnalytics | undefined;
  isLoading?: boolean;
  isVectorLoading?: boolean;
  isRemediationLoading?: boolean;
  isError?: boolean;
  isRemediationError?: boolean;
}

const DistributionDonut = ({
  activeTab,
  analyticsData,
  vectorData,
  remediationData,
  isLoading: isAnalyticsLoading,
  isVectorLoading,
  isRemediationLoading,
  isError,
  isRemediationError,
}: DistributionDonutProps) => {
  const getTooltipDescription = () => {
    switch (activeTab) {
      case 'source':
        return 'Distribution of vulnerabilities across NVD, OSV, and malware databases. Note that Malware (MAL) advisories are originally part of OSV but are isolated here as a separate source for malware tracking.';
      case 'severity':
        return 'Breakdown of vulnerabilities by CVSS severity levels (Critical, High, Medium, Low, None). Calculated from CVSS scores in NVD and OSV.';
      case 'remediation':
        return 'Status of available remediations (Patch Ready, Unpatched, Solution Provided, Pending, EOL). Calculated from security advisory and patch metadata.';
      default:
        return 'Vulnerabilities classified by network/physical accessibility requirement (Network, Adjacent, Local, Physical). Derived from CVSS attack vectors.';
    }
  };

  // 1. Sorting logic moved here (Internal concern)
  const sortedSeverityDistribution = useMemo(() => {
    if (!analyticsData?.distribution) return [];
    return [...analyticsData.distribution].sort((a, b) => 
      (SEVERITY_ORDER[a.label] ?? 99) - (SEVERITY_ORDER[b.label] ?? 99)
    );
  }, [analyticsData]);

  const sortedVectorDistribution = useMemo(() => {
    if (!vectorData?.distribution) return [];
    return [...vectorData.distribution].sort((a, b) => b.count - a.count);
  }, [vectorData]);

  const sortedRemediationDistribution = useMemo(() => {
    if (!remediationData?.distribution) return [];
    return [...remediationData.distribution].sort((a, b) => b.count - a.count);
  }, [remediationData]);

  const getVectorColor = (vector: string | undefined) => {
    if (!vector) return '#333';
    return VECTOR_COLORS[vector.toUpperCase()] || '#333';
  };

  const totalVectorCount = useMemo(() => 
    vectorData?.distribution.reduce((acc, curr) => acc + curr.count, 0) || 0
  , [vectorData]);

  const totalIntelligenceCount = useMemo(() => 
    analyticsData?.sourceDistribution.reduce((acc, curr) => acc + curr.count, 0) || 0
  , [analyticsData]);

  const totalRemediationCount = useMemo(() => 
    remediationData?.distribution.reduce((acc, curr) => acc + curr.count, 0) || 0
  , [remediationData]);

  const currentData = useMemo(() => {
    if (activeTab === 'source') return analyticsData?.sourceDistribution;
    if (activeTab === 'severity') return sortedSeverityDistribution;
    if (activeTab === 'remediation') return sortedRemediationDistribution;
    return sortedVectorDistribution;
  }, [activeTab, analyticsData, sortedSeverityDistribution, sortedVectorDistribution, sortedRemediationDistribution]);

  const isLoading = useMemo(() => {
    if (activeTab === 'vector') return isVectorLoading;
    if (activeTab === 'remediation') return isRemediationLoading;
    return isAnalyticsLoading;
  }, [activeTab, isAnalyticsLoading, isVectorLoading, isRemediationLoading]);

  const [isReady, setIsReady] = useState(false);

  if ((isLoading || isError || !currentData) && isReady) {
    setIsReady(false);
  }

  useEffect(() => {
    if (!isLoading && !isError && currentData) {
      const timer = setTimeout(() => setIsReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isError, currentData]);

  const donutTitle =
    activeTab === 'source'
      ? 'Intelligence Sources'
      : activeTab === 'severity'
        ? 'Severity Breakdown'
        : activeTab === 'remediation'
          ? 'Remediation Readiness'
          : 'Vector Distribution';

  const donutAccent =
    activeTab === 'source'
      ? 'bg-blue-500'
      : activeTab === 'severity'
        ? 'bg-red-500'
        : 'bg-emerald-500';

  return (
    <div className="bg-neutral-900/40 border border-white/[0.14] p-8 rounded-[32px] flex flex-col h-[480px] relative overflow-visible">
      <DashboardPanelHeader
        title={donutTitle}
        accentClassName={donutAccent}
        tooltip={getTooltipDescription()}
        tooltipPlacement="end"
      />

      {isError || (activeTab === 'remediation' && isRemediationError) ? (
        <ErrorState variant="placeholder" {...DEFAULT_PLACEHOLDER_ERROR} className="flex-grow" />
      ) : (
        <>
          <div className="flex-grow relative min-w-0 min-h-0">
            {/* Skeleton for Donut */}
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-[20px] border-white/[0.12] animate-skeleton flex flex-col items-center justify-center">
                  <div className="w-12 h-2 bg-white/10 rounded mb-2" />
                  <div className="w-20 h-6 bg-white/10 rounded" />
                </div>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                    {
                      activeTab === 'source' ? 'Total Intel' : 
                      activeTab === 'severity' ? 'Total Avg' : 
                      activeTab === 'remediation' ? 'Total Analyzed' : 'Total Analyzed'
                    }
                  </span>
                  <span className="text-3xl font-black text-white tracking-tighter">
                    {
                      activeTab === 'source' ? totalIntelligenceCount.toLocaleString() : 
                      activeTab === 'severity' ? (analyticsData?.averageScore ?? '0.0') : 
                      activeTab === 'remediation' ? totalRemediationCount.toLocaleString() : totalVectorCount.toLocaleString()
                    }
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  {!isReady ? <div /> : (
                    <PieChart width={220} height={220}>
                      <Pie
                        data={currentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="count"
                        nameKey="label"
                        stroke="none"
                      >
                        {activeTab === 'source' 
                          ? analyticsData?.sourceDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.label] || '#333'} />
                            ))
                          : activeTab === 'severity'
                          ? sortedSeverityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.label] || '#333'} />
                            ))
                          : activeTab === 'remediation'
                          ? sortedRemediationDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={REMEDIATION_COLORS[entry.label] || '#333'} />
                            ))
                          : sortedVectorDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getVectorColor(entry.attackVector)} />
                            ))
                        }
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const label = data.label || data.attackVector || 'Unknown';
                            const dotClass = distributionDotClass(activeTab, label);
                            const glowClass = distributionDotGlowClass(activeTab, label);

                            return (
                              <div className="bg-neutral-950/90 border border-white/10 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md animate-reveal flex flex-col gap-1 min-w-[140px] z-50">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${dotClass} ${glowClass}`} />
                                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">{label}</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-base font-black text-white font-mono">{data.count?.toLocaleString()}</span>
                                  <span className="text-[9px] font-bold text-neutral-500">cases</span>
                                </div>
                                {data.percentage !== undefined && (
                                  <span className="text-[9px] font-black text-emerald-400 font-mono">({data.percentage}%)</span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  )}
                </div>
              </>
            )}
          </div>

          <div className={`grid ${activeTab === 'source' ? 'grid-cols-1' : 'grid-cols-2'} gap-x-6 gap-y-3 mt-6`}>
            {isLoading
              ? Array.from({ length: activeTab === 'source' ? 3 : 6 }).map((_, i) => (
                  <div key={i} className={`flex items-center ${activeTab === 'source' ? 'justify-center' : 'justify-start'} gap-3 animate-skeleton`}>
                    <div className="w-2 h-2 rounded-full bg-white/10" />
                    <div className={`flex flex-col ${activeTab === 'source' ? 'items-center' : ''} gap-1`}>
                      <div className="w-12 h-2 bg-white/10 rounded" />
                      <div className="w-16 h-3 bg-white/10 rounded" />
                    </div>
                  </div>
                ))
              : activeTab === 'source' 
              ? analyticsData?.sourceDistribution?.map((item) => (
                  <div key={item.label} className="flex items-center justify-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sourceDotClass(item.label)}`} />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">{item.label}</span>
                      <span className="text-xs font-black text-white">{item.count.toLocaleString()} ({item.percentage}%)</span>
                    </div>
                  </div>
                ))
              : activeTab === 'severity'
              ? sortedSeverityDistribution.map((item) => (
                  <div key={item.label} className="flex items-center justify-start gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDotClass(item.label)}`} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">{item.label}</span>
                      <span className="text-xs font-black text-white">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              : activeTab === 'remediation'
              ? sortedRemediationDistribution.map((item) => (
                  <div key={item.label} className="flex items-center justify-start gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${remediationDotClass(item.label)}`} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">{item.label}</span>
                      <span className="text-xs font-black text-white">{item.percentage}%</span>
                    </div>
                  </div>
                ))
              : sortedVectorDistribution.map((item) => (
                  <div key={item.attackVector} className="flex items-center justify-start gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${vectorDotClass(item.attackVector)}`} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">{item.attackVector}</span>
                      <span className="text-xs font-black text-white">{item.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))
            }
          </div>
        </>
      )}
    </div>
  );
};

export default DistributionDonut;