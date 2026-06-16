import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  compact?: boolean;
}

const SectionCard = ({
  icon: Icon,
  title,
  children,
  compact = false,
}: SectionCardProps) => (
  <div
    className={
      compact
        ? 'p-5 bg-neutral-900/40 cc-panel-border-soft rounded-2xl space-y-2'
        : 'p-8 bg-neutral-900/40 cc-panel-border rounded-[32px] space-y-6'
    }
  >
    <div
      className={`flex items-center gap-2 text-neutral-400 border-b cc-divider-h ${compact ? 'pb-1.5' : 'pb-3'}`}
    >
      <Icon size={compact ? 14 : 16} />
      <span
        className={`font-black uppercase tracking-widest text-neutral-400 ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

export default SectionCard;
