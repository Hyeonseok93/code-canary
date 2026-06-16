import { Terminal } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageHeader from '../components/admin/AdminPageHeader';
import PipelineJobLog from '../components/admin/PipelineJobLog';
import { useAdminPageShell } from '../hooks/useAdminPageShell';
import { usePipelineControl } from '../hooks/usePipelineControl';

const AdminJobMonitorPage = () => {
  const { username, onLogout } = useAdminPageShell();
  const { activity, isActivityLoading, isRunning, hasRunningJob, releaseStuckJob, isReleasingStuck } =
    usePipelineControl({
      activityLimit: 100,
      fetchActivity: true,
    });

  return (
    <AdminLayout username={username} onLogout={onLogout}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-10 py-8 lg:py-12 space-y-8 animate-reveal">
        <AdminPageHeader
          chipIcon={Terminal}
          chipLabel="Job Monitor"
          chipBorderClassName="border-blue-500/35 bg-blue-500/5"
          chipIconClassName="text-blue-400"
          chipTextClassName="text-blue-400/90"
          title={
            <>
              Worker <span className="text-neutral-500">Activity</span>
            </>
          }
          description={
            <>
              Job start, progress, and failure messages written by the worker into{' '}
              <code className="text-neutral-400">management.pipeline_job_logs</code>. Stop a collect job from Control
              Plane — the stop request and result appear here. For raw container stdout, use{' '}
              <code className="text-neutral-400">docker compose logs -f worker</code>.
            </>
          }
          hasRunningJob={hasRunningJob}
          isReleasingStuck={isReleasingStuck}
          onReleaseStuck={releaseStuckJob}
        />

        <PipelineJobLog
          title="Pipeline Job Log"
          entries={activity}
          isLoading={isActivityLoading}
          isLive={isRunning}
        />

        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 pb-4">
          Auto-refresh {isRunning ? 'every 5s while jobs are active' : 'every 20s'}
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminJobMonitorPage;
