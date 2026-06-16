import { Terminal } from 'lucide-react';
import type { PipelineActivityEntry } from '../../types/pipeline';
import { formatSyncDateTime } from '../../utils/dateTime';
import { sanitizeOperatorMessage } from '../../utils/operatorMessage';

const LEVEL_COLORS: Record<PipelineActivityEntry['level'], string> = {
  info: 'text-blue-400',
  warn: 'text-amber-400',
  success: 'text-emerald-400',
  error: 'text-red-400',
};

interface PipelineJobLogProps {
  entries: PipelineActivityEntry[];
  isLoading?: boolean;
  title?: string;
  isLive?: boolean;
}

const PipelineJobLog = ({
  entries,
  isLoading,
  title = 'Recent Activity',
  isLive,
}: PipelineJobLogProps) => (
  <section className="rounded-[28px] cc-admin-border bg-neutral-950/60 overflow-hidden flex flex-col h-[520px]">
    <div className="flex items-center justify-between px-5 py-3.5 border-b cc-admin-divider bg-neutral-900/50">
      <div className="flex items-center gap-2 text-neutral-400">
        <Terminal size={16} />
        <span className="text-[10px] font-black uppercase tracking-[0.18em]">{title}</span>
      </div>
      <span className="text-[9px] font-mono text-neutral-600 uppercase">
        {isLoading ? 'loading…' : isLive ? 'live' : 'idle'}
      </span>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 pr-3 space-y-2 font-mono text-[11px] leading-relaxed">
      {entries.length === 0 ? (
        <p className="text-neutral-600 text-center py-8">No pipeline activity yet. Start the worker runner and enqueue a job.</p>
      ) : (
        entries.map((entry) => {
          const message = sanitizeOperatorMessage(entry.message) ?? 'Pipeline activity recorded.';
          return (
          <div
            key={entry.id}
            className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 rounded-xl bg-black/30 cc-admin-border-soft hover:border-white/30 transition-colors"
          >
            <span className="text-neutral-600 shrink-0">
              {formatSyncDateTime(entry.timestamp, { withSeconds: true })}
            </span>
            <span className={`shrink-0 font-black uppercase text-[10px] ${LEVEL_COLORS[entry.level]}`}>
              {entry.level}
            </span>
            <span className="text-neutral-500 shrink-0">[{entry.source}]</span>
            <span className="text-neutral-300">{message}</span>
          </div>
          );
        })
      )}
    </div>
  </section>
);

export default PipelineJobLog;
