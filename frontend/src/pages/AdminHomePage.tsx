import { AlertTriangle, Cpu } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import PipelineSourcePanel from '../components/admin/PipelineSourcePanel';
import PipelineSourcePanelSkeleton from '../components/admin/PipelineSourcePanelSkeleton';
import PipelineGoldBanner from '../components/admin/PipelineGoldBanner';
import PipelineGoldBannerSkeleton from '../components/admin/PipelineGoldBannerSkeleton';
import { PIPELINE_STEP_KEYS } from '../constants/pipelineStepKeys';
import { staggerDelayClass } from '../utils/chartColorClasses';
import { useAdminPageShell } from '../hooks/useAdminPageShell';
import { usePipelineControl } from '../hooks/usePipelineControl';
import { usePipelineStaging } from '../hooks/usePipelineStaging';

const AdminHomePage = () => {
  const { username, onLogout } = useAdminPageShell();

  const {
    pipelines,
    gold,
    isLoading: isPipelineLoading,
    isRunning,
    hasRunningJob,
    runStep,
    stopStep,
    releaseStuckJob,
    isReleasingStuck,
    pendingStepKey,
    stoppingStepKey,
    actionError,
    clearActionError,
  } = usePipelineControl();

  const { data: staging } = usePipelineStaging();

  return (
    <AdminLayout username={username} onLogout={onLogout}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10 py-8 lg:py-12 space-y-10 animate-reveal">
        <AdminPageHeader
          chipIcon={Cpu}
          chipLabel="Data Control Plane"
          chipBorderClassName="border-amber-500/35 bg-amber-500/5"
          chipIconClassName="text-amber-400"
          chipTextClassName="text-amber-400/90"
          title={
            <>
              Control <span className="text-neutral-500">Plane</span>
            </>
          }
          description={
            <>
              Enqueue ingest and refinery jobs from the admin console. The{' '}
              <code className="text-neutral-400">worker</code> Compose service polls the job queue and runs each step
              automatically.
            </>
          }
          hasRunningJob={hasRunningJob}
          isReleasingStuck={isReleasingStuck}
          onReleaseStuck={() => {
            clearActionError();
            releaseStuckJob();
          }}
        />

        {actionError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>{actionError}</p>
          </div>
        )}

        {isPipelineLoading ? (
          <div className="space-y-8">
            <PipelineSourcePanelSkeleton accent="blue" />
            <PipelineSourcePanelSkeleton accent="emerald" />
          </div>
        ) : (
          <div className="space-y-8">
            {pipelines.map((pipeline, index) => (
              <div
                key={pipeline.source}
                className={`animate-reveal ${staggerDelayClass(index)}`}
              >
                <PipelineSourcePanel
                  pipeline={pipeline}
                  stagingBaselines={pipeline.source === 'NVD' ? (staging?.nvd ?? []) : (staging?.osv ?? [])}
                  onRunStep={(stepKey, options) => {
                    clearActionError();
                    runStep(stepKey, options);
                  }}
                  onStopStep={(stepKey) => {
                    clearActionError();
                    stopStep(stepKey);
                  }}
                  isRunning={isRunning}
                  pendingStepKey={pendingStepKey}
                  stoppingStepKey={stoppingStepKey}
                />
              </div>
            ))}
          </div>
        )}

        {isPipelineLoading ? (
          <PipelineGoldBannerSkeleton />
        ) : (
          <div className="animate-reveal reveal-delay-240">
            <PipelineGoldBanner
              gold={gold}
              onRefreshGold={() => {
                clearActionError();
                runStep(PIPELINE_STEP_KEYS.GOLD_REFRESH);
              }}
              isRunning={isRunning}
              isRefreshing={pendingStepKey === PIPELINE_STEP_KEYS.GOLD_REFRESH}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHomePage;
