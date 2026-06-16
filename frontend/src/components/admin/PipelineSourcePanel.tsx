import { useState } from 'react';
import { Clock, ChevronDown, Layers, Loader2, Play, Square } from 'lucide-react';
import type { DataSourcePipelineView, PipelineStagingBaseline } from '../../types/pipeline';
import { PIPELINE_STEP_KEYS, CANCELLABLE_COLLECT_STEPS } from '../../constants/pipelineStepKeys';
import { formatSyncDateTime } from '../../utils/dateTime';
import { formatStagingBaselineLabel } from '../../utils/stagingFormat';
import { StatusBadge } from './adminUiUtils';

interface PipelineSourcePanelProps {
  pipeline: DataSourcePipelineView;
  stagingBaselines: PipelineStagingBaseline[];
  onRunStep: (
    stepKey: string,
    options?: { stagingRef?: string | null; collectMode?: 'full' | 'incremental' | null }
  ) => void;
  onStopStep: (stepKey: string) => void;
  isRunning: boolean;
  pendingStepKey: string | null;
  stoppingStepKey: string | null;
}

const LOAD_STEPS = new Set(['nvd-load', 'osv-load']);
const NVD_COLLECT_STEP = PIPELINE_STEP_KEYS.NVD_COLLECT;

const accentMap = {
  blue: {
    border: 'border-blue-500/45 hover:border-blue-500/65',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.08)]',
    icon: 'text-blue-400 bg-blue-500/10 border-blue-500/40',
    chip: 'text-blue-300',
  },
  emerald: {
    border: 'border-emerald-500/45 hover:border-emerald-500/65',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.08)]',
    icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
    chip: 'text-emerald-300',
  },
};

const selectClassName =
  'w-full min-w-0 appearance-none rounded-xl cc-admin-border-soft bg-black/40 pl-3 pr-9 py-2 text-[10px] font-mono text-left text-neutral-300 focus:outline-none focus:border-amber-500/45 disabled:opacity-50';

const STEP_CARD_HEIGHT = 'h-[20rem]';
const METADATA_HEIGHT = 'h-[3.25rem]';
const CONTROL_SLOT_HEIGHT = 'h-[4.75rem]';

const PipelineSourcePanel = ({
  pipeline,
  stagingBaselines,
  onRunStep,
  onStopStep,
  isRunning,
  pendingStepKey,
  stoppingStepKey,
}: PipelineSourcePanelProps) => {
  const accent = accentMap[pipeline.accent];
  const [selectedRefs, setSelectedRefs] = useState<Record<string, string>>({});
  const [selectedCollectModes, setSelectedCollectModes] = useState<Record<string, string>>({});

  const syncActive = pipeline.syncStatus === 'running' || pipeline.syncStatus === 'pending';

  return (
    <section
      className={`rounded-[28px] cc-admin-border bg-neutral-950/50 p-6 sm:p-8 transition-all duration-500 ${accent.border} ${accent.glow}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${accent.icon}`}>
            <Layers size={22} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-500 mb-1">
              Data Source
            </p>
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{pipeline.source}</h3>
            <p className="mt-2 text-[12px] text-neutral-500 font-medium">
              Sync started{' '}
              <span className={`font-mono ${accent.chip}`}>
                {formatSyncDateTime(pipeline.lastCollectedAt)}
              </span>
              {syncActive && (
                <span className="ml-2 text-amber-400 uppercase text-[10px] font-black tracking-widest">
                  {pipeline.syncStatus === 'pending' ? 'Queued' : 'Running'}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <div className="px-3 py-2 rounded-xl bg-black/40 cc-admin-border-soft text-center min-w-[100px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Bronze Rows</p>
            <p className="text-lg font-black text-white font-mono">{pipeline.recordsInBronze.toLocaleString()}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-black/40 cc-admin-border-soft text-center min-w-[100px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Pending Silver</p>
            <p className="text-lg font-black text-amber-300 font-mono">{pipeline.pendingSilver.toLocaleString()}</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-black/40 cc-admin-border-soft text-center min-w-[100px]">
            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Silver Rows</p>
            <p className="text-lg font-black text-slate-200 font-mono">{pipeline.recordsInSilver.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pipeline.steps.map((step, index) => {
            const stepBusy = step.status === 'running' || step.status === 'pending';
            const disableRun = isRunning || stepBusy || pendingStepKey === step.id;
            const showStop = stepBusy && CANCELLABLE_COLLECT_STEPS.has(step.id);
            const disableStop = stoppingStepKey === step.id;
            const isLoadStep = LOAD_STEPS.has(step.id);
            const isNvdCollectStep = step.id === NVD_COLLECT_STEP;
            const selectedRef = selectedRefs[step.id] ?? '';
            const selectedCollectMode = selectedCollectModes[step.id] ?? 'full';
            const hasBaselines = stagingBaselines.length > 0;

            return (
              <div key={step.id} className="relative">
                <div
                  className={`${STEP_CARD_HEIGHT} rounded-[22px] cc-admin-border-soft bg-black/30 p-4 flex flex-col gap-3 hover:bg-white/[0.02] hover:border-white/30 transition-all group`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">
                      Step {index + 1}
                    </span>
                    <StatusBadge status={step.status} />
                  </div>

                  <div>
                    <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{step.shortLabel}</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed mt-1.5 min-h-[32px]">{step.description}</p>
                  </div>

                  <div className={`${METADATA_HEIGHT} space-y-1 text-[10px] text-neutral-600 font-mono overflow-hidden`}>
                    {step.lastRunAt ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} />
                        <span>{formatSyncDateTime(step.lastRunAt)}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-700">—</span>
                    )}
                    <p className={step.durationLabel ? 'text-neutral-600' : 'invisible'} aria-hidden={!step.durationLabel}>
                      Duration{' '}
                      <span className="text-neutral-400">{step.durationLabel ?? '—'}</span>
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-neutral-700">
                      Step key <span className="text-neutral-500">{step.id}</span>
                    </p>
                    {step.status === 'failed' && step.errorMessage && (
                      <p className="text-[9px] text-red-400/90 line-clamp-2">
                        {step.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col gap-3 shrink-0">
                    <div className={`${CONTROL_SLOT_HEIGHT} shrink-0 flex flex-col justify-end overflow-hidden`}>
                      {isNvdCollectStep && (
                        <label className="block w-full min-w-0 space-y-1.5">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-neutral-600">
                            Collect mode
                          </span>
                          <div className="relative w-full min-w-0">
                            <select
                              value={selectedCollectMode}
                              disabled={disableRun}
                              onChange={(event) =>
                                setSelectedCollectModes((previous) => ({
                                  ...previous,
                                  [step.id]: event.target.value,
                                }))
                              }
                              className={selectClassName}
                            >
                              <option value="full">Full catalog</option>
                              <option value="incremental">Incremental</option>
                            </select>
                            <ChevronDown
                              size={14}
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                              aria-hidden
                            />
                          </div>
                        </label>
                      )}
                      {isLoadStep && (
                        <label className="block w-full min-w-0 space-y-1.5">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-neutral-600">
                            Staging baseline
                          </span>
                          <div className="relative w-full min-w-0">
                            <select
                              value={selectedRef}
                              disabled={disableRun || !hasBaselines}
                              onChange={(event) =>
                                setSelectedRefs((previous) => ({
                                  ...previous,
                                  [step.id]: event.target.value,
                                }))
                              }
                              className={selectClassName}
                            >
                              {hasBaselines ? (
                                <>
                                  <option value="">Latest baseline (auto)</option>
                                  {stagingBaselines.map((baseline) => (
                                    <option key={baseline.id} value={baseline.id}>
                                      {formatStagingBaselineLabel(baseline)}
                                    </option>
                                  ))}
                                </>
                              ) : (
                                <option value="">No baseline collected yet</option>
                              )}
                            </select>
                            <ChevronDown
                              size={14}
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
                              aria-hidden
                            />
                          </div>
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={showStop ? disableStop : disableRun}
                      onClick={() =>
                        showStop
                          ? onStopStep(step.id)
                          : onRunStep(step.id, {
                              stagingRef: isLoadStep ? selectedRef || null : null,
                              collectMode: isNvdCollectStep
                                ? (selectedCollectMode as 'full' | 'incremental')
                                : null,
                            })
                      }
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl cc-admin-border-soft text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        showStop
                          ? 'bg-red-500/10 text-red-300 enabled:hover:border-red-500/45 enabled:hover:bg-red-500/15 enabled:hover:text-red-200'
                          : 'bg-white/[0.02] text-neutral-300 enabled:hover:border-amber-500/45 enabled:hover:text-amber-300 enabled:hover:bg-amber-500/5'
                      }`}
                    >
                      {showStop ? (
                        stoppingStepKey === step.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Square size={12} />
                        )
                      ) : pendingStepKey === step.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} />
                      )}
                      {showStop
                        ? step.status === 'pending'
                          ? 'Stop Queued Step'
                          : 'Stop Step'
                        : isNvdCollectStep
                          ? selectedCollectMode === 'incremental'
                            ? 'Run Incremental Collect'
                            : 'Run Full Collect'
                          : step.id.endsWith('-collect')
                            ? 'Run Collect'
                            : 'Run Step'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PipelineSourcePanel;
