import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import StuckJobReleaseButton from './StuckJobReleaseButton';

interface AdminPageHeaderProps {
  chipIcon: LucideIcon;
  chipLabel: string;
  chipBorderClassName: string;
  chipIconClassName: string;
  chipTextClassName: string;
  title: ReactNode;
  description: ReactNode;
  hasRunningJob?: boolean;
  isReleasingStuck?: boolean;
  onReleaseStuck?: () => void;
}

const AdminPageHeader = ({
  chipIcon: ChipIcon,
  chipLabel,
  chipBorderClassName,
  chipIconClassName,
  chipTextClassName,
  title,
  description,
  hasRunningJob = false,
  isReleasingStuck = false,
  onReleaseStuck,
}: AdminPageHeaderProps) => (
  <header className="space-y-4">
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${chipBorderClassName}`}>
      <ChipIcon size={12} className={chipIconClassName} />
      <span className={`text-[9px] font-black uppercase tracking-[0.22em] ${chipTextClassName}`}>{chipLabel}</span>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">
          {title}
        </h1>
        <p className="mt-4 text-sm text-neutral-500 max-w-2xl leading-relaxed">{description}</p>
      </div>
      {onReleaseStuck && (
        <StuckJobReleaseButton
          visible={hasRunningJob}
          isReleasing={isReleasingStuck}
          onRelease={onReleaseStuck}
        />
      )}
    </div>
  </header>
);

export default AdminPageHeader;
