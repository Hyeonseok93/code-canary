import { useState } from 'react';
import AnalyticsTabs from './AnalyticsTabs';
import type { DashboardTab } from './AnalyticsTabs';
import DistributionDonut from './DistributionDonut';
import TrendTimeline from './TrendTimeline';
import EcosystemTable from './EcosystemTable';
import EcosystemBarChart from './EcosystemBarChart';
import WeaknessExplorer from './WeaknessExplorer';
import RemediationTrendChart from './RemediationTrendChart';
import KevIntelligenceGrid from './KevIntelligenceGrid';
import type { DashboardAnalytics, VectorAnalytics } from '../../types/analytics';
import { useEcosystemAnalytics, useWeaknessAnalytics, useRemediationAnalytics } from '../../hooks/useDashboardAnalytics';

interface AnalyticsDashboardProps {
  analyticsData: DashboardAnalytics | undefined;
  vectorData: VectorAnalytics | undefined;
  isAnalyticsLoading?: boolean;
  isVectorLoading?: boolean;
  isAnalyticsError?: boolean;
  isVectorError?: boolean;
}

const AnalyticsDashboard = ({ 
  analyticsData, 
  vectorData,
  isAnalyticsLoading,
  isVectorLoading,
  isAnalyticsError,
  isVectorError
}: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('source');
  const { data: ecosystemData, isLoading: isEcosystemLoading, isError: isEcosystemLoadingError } = useEcosystemAnalytics();
  const { data: weaknessData, isLoading: isWeaknessLoading, isError: isWeaknessError } = useWeaknessAnalytics();
  const { data: remediationData, isLoading: isRemediationLoading, isError: isRemediationError } = useRemediationAnalytics();

  return (
    <>
      <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-reveal min-w-0" style={{ animationDelay: '0.6s' }}>
        {activeTab === 'ecosystem' ? (
          <>
            <EcosystemTable 
              data={ecosystemData?.distribution} 
              isLoading={isEcosystemLoading} 
              isError={isEcosystemLoadingError} 
            />
            <EcosystemBarChart 
              data={ecosystemData?.trends} 
              isLoading={isEcosystemLoading} 
              isError={isEcosystemLoadingError} 
            />
          </>
        ) : activeTab === 'weakness' ? (
          <div className="lg:col-span-3">
            <WeaknessExplorer 
              data={weaknessData}
              isLoading={isWeaknessLoading}
              isError={isWeaknessError}
            />
          </div>
        ) : activeTab === 'remediation' ? (
          <>
            <DistributionDonut 
              activeTab={activeTab} 
              analyticsData={analyticsData} 
              vectorData={vectorData} 
              remediationData={remediationData}
              isLoading={isAnalyticsLoading}
              isVectorLoading={isVectorLoading}
              isRemediationLoading={isRemediationLoading}
              isError={isAnalyticsError}
              isRemediationError={isRemediationError}
            />
            <RemediationTrendChart 
              data={remediationData}
              isLoading={isRemediationLoading}
              isError={isRemediationError}
            />
          </>
        ) : (
          <>
            <DistributionDonut 
              activeTab={activeTab} 
              analyticsData={analyticsData} 
              vectorData={vectorData} 
              remediationData={remediationData}
              isLoading={isAnalyticsLoading}
              isVectorLoading={isVectorLoading}
              isRemediationLoading={isRemediationLoading}
              isError={activeTab === 'vector' ? isVectorError : isAnalyticsError}
              isRemediationError={isRemediationError}
            />

            <TrendTimeline 
              activeTab={activeTab} 
              analyticsData={analyticsData} 
              vectorData={vectorData} 
              isLoading={isAnalyticsLoading}
              isVectorLoading={isVectorLoading}
              isError={activeTab === 'vector' ? isVectorError : isAnalyticsError}
            />
          </>
        )}
      </div>

      <KevIntelligenceGrid />
    </>
  );
};

export default AnalyticsDashboard;