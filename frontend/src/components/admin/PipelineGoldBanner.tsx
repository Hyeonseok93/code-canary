import { Clock, Gem, Loader2, Play, RefreshCw, Sparkles } from 'lucide-react';import type { GoldSummaryView } from '../../types/pipeline';
import { formatSyncDateTime } from '../../utils/dateTime';
import { StatusBadge } from './adminUiUtils';

interface PipelineGoldBannerProps {
  gold: GoldSummaryView | undefined;
  onRefreshGold: () => void;
  isRunning: boolean;
  isRefreshing: boolean;
}

const PipelineGoldBanner = ({
  gold,
  onRefreshGold,
  isRunning,
  isRefreshing,
}: PipelineGoldBannerProps) => {  const badgeStatus = gold?.status ?? 'idle';
  const disableRefresh =
    isRunning || badgeStatus === 'running' || badgeStatus === 'pending' || isRefreshing;

  return (
    <section className="rounded-[28px] border border-violet-500/45 bg-gradient-to-br from-violet-950/40 via-neutral-950/60 to-neutral-950/80 p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-fuchsia-500/5 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col xl:flex-row xl:items-start justify-between gap-8">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 rounded-2xl border border-violet-500/45 bg-violet-500/10 text-violet-300">
            <Gem size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400/80 mb-1">
              Shared Refinery · Step 4
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter uppercase">
              Gold Layer Snapshot
            </h3>
            <p className="mt-2 text-[12px] text-neutral-400 max-w-2xl leading-relaxed">
              NVD and OSV silver outputs roll up here. Refresh Gold enqueues{' '}
              <code className="text-violet-300/90">gold-refresh</code> — explorer inventory and dashboard
              snapshots.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-mono text-neutral-600">
              <StatusBadge status={badgeStatus} />
              {gold?.lastRunAt ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={11} />
                  Last job {formatSyncDateTime(gold.lastRunAt)}
                </span>
              ) : (
                <span className="text-neutral-700">No gold job yet</span>
              )}
              {gold?.durationLabel && (
                <span>
                  Duration <span className="text-neutral-400">{gold.durationLabel}</span>
                </span>
              )}
              {gold?.lastJobId != null && (
                <span className="text-neutral-700">Job #{gold.lastJobId}</span>
              )}
              {badgeStatus === 'failed' && gold?.errorMessage && (
                <span className="text-red-400/90 normal-case tracking-normal">{gold.errorMessage}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row xl:flex-col gap-3 shrink-0 xl:w-[240px]">
          <div className="px-4 py-3 rounded-2xl bg-black/40 cc-admin-border-soft">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600 mb-1">
              Data last refreshed
            </p>
            <p className="text-sm font-mono font-bold text-white">
              {formatSyncDateTime(gold?.lastRefreshedAt)}
            </p>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-black/40 cc-admin-border-soft">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600 mb-1">
              Explorer rows
            </p>
            <p className="text-base font-black text-white font-mono">
              {gold ? gold.explorerRows.toLocaleString() : '—'}
            </p>
          </div>

          <button
            type="button"
            disabled={disableRefresh}
            onClick={onRefreshGold}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-violet-500/45 bg-violet-500/10 text-[10px] font-black uppercase tracking-widest text-violet-200 enabled:hover:bg-violet-500/20 enabled:hover:border-violet-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh Gold
          </button>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-4 pt-5 border-t cc-admin-divider text-[10px] font-bold uppercase tracking-widest text-neutral-500">
        <span className="inline-flex items-center gap-1.5 text-violet-300/80">
          <Sparkles size={12} />
          Medallion: Bronze → Silver → Gold
        </span>
        <span className="text-neutral-700">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Play size={11} />
          worker step key <code className="text-violet-300/90">gold-refresh</code>
        </span>
      </div>
    </section>
  );
};

export default PipelineGoldBanner;

