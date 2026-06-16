import { Database } from 'lucide-react';
import { formatSourceBadgeLabel, getSourceBadgeClasses } from '../../utils/sourceBadge';

interface SourceBadgeProps {
  source: string;
  compact?: boolean;
}

const SourceBadge = ({ source, compact = false }: SourceBadgeProps) => {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-widest uppercase ${getSourceBadgeClasses(source)}`}
      >
        <Database size={10} />
        {source}
      </span>
    );
  }

  return (
    <span
      className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getSourceBadgeClasses(source)}`}
    >
      {formatSourceBadgeLabel(source, false)}
    </span>
  );
};

export default SourceBadge;
