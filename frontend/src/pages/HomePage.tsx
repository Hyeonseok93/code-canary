import MainLayout from '../layouts/MainLayout';
import { useMetrics } from '../hooks/useMetrics';
import { useIngestionSync } from '../hooks/useIngestionSync';
import { useAnalytics, useVectorAnalytics } from '../hooks/useDashboardAnalytics';
import HeroSection from '../components/dashboard/HeroSection';
import MetricsGrid from '../components/dashboard/MetricsGrid';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

const HomePage = () => {
  const { data: metricsData, isLoading: metricsLoading, isError: metricsError } = useMetrics();
  const { data: syncData, isLoading: syncLoading } = useIngestionSync();

  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } = useAnalytics();
  const { data: vectorData, isLoading: vectorLoading, isError: vectorError } = useVectorAnalytics();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-24">
        <HeroSection
          nvdLastUpdatedAt={syncData?.nvdLastCollectedAt ?? undefined}
          osvLastUpdatedAt={syncData?.osvLastCollectedAt ?? undefined}
          isSyncLoading={syncLoading}
        />

        {/* 2. Metrics Header */}
        <div className="mt-20 mb-8 px-2 animate-reveal reveal-delay-200">
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Intelligence <span className="text-neutral-500">Metrics</span>
          </h2>
        </div>

        {/* 3. Metrics Grid: Summary Counters */}
        <MetricsGrid 
          metrics={metricsData} 
          isLoading={metricsLoading} 
          isError={metricsError} 
        />

        {/* 3. Analytics Dashboard: Tabs, Distribution, and Trends */}
        <div className="mt-24 mb-8 px-2 animate-reveal reveal-delay-400">
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Analytical <span className="text-neutral-500">Deep-dive</span>
          </h2>
        </div>
        <AnalyticsDashboard 
          analyticsData={analyticsData} 
          vectorData={vectorData} 
          isAnalyticsLoading={analyticsLoading}
          isVectorLoading={vectorLoading}
          isAnalyticsError={analyticsError}
          isVectorError={vectorError}
        />
      </div>
    </MainLayout>
  );
};

export default HomePage;