import type { PipelineStepStatus } from '../../types/pipeline';

const STATUS_STYLES: Record<
  PipelineStepStatus,
  { dot: string; badge: string; label: string }
> = {
  idle: {
    dot: 'bg-neutral-500',
    badge: 'text-neutral-400 border-neutral-500/50 bg-neutral-500/5',
    label: 'Idle',
  },
  running: {
    dot: 'bg-amber-400 animate-pulse',
    badge: 'text-amber-300 border-amber-500/45 bg-amber-500/10',
    label: 'Running',
  },
  success: {
    dot: 'bg-emerald-400',
    badge: 'text-emerald-300 border-emerald-500/45 bg-emerald-500/10',
    label: 'Done',
  },
  failed: {
    dot: 'bg-red-400',
    badge: 'text-red-300 border-red-500/45 bg-red-500/10',
    label: 'Failed',
  },
  pending: {
    dot: 'bg-orange-400',
    badge: 'text-orange-300 border-orange-500/45 bg-orange-500/10',
    label: 'Queued',
  },
};

export const StatusBadge = ({ status }: { status: PipelineStepStatus }) => {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${styles.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {styles.label}
    </span>
  );
};
