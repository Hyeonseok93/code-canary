import type { ReactNode } from 'react';
import DashboardHelpTooltip from './DashboardHelpTooltip';

interface DashboardPanelHeaderProps {
  title: string;
  accentClassName: string;
  tooltip?: string;
  tooltipPlacement?: 'inline' | 'end';
  trailing?: ReactNode;
  className?: string;
}

const DashboardPanelHeader = ({
  title,
  accentClassName,
  tooltip,
  tooltipPlacement = 'inline',
  trailing,
  className = 'mb-8',
}: DashboardPanelHeaderProps) => (
  <div className={`flex items-center justify-between relative ${className}`}>
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
        <div className={`w-1 h-4 rounded-full ${accentClassName}`} />
        {title}
      </h3>
      {tooltip && tooltipPlacement === 'inline' && <DashboardHelpTooltip description={tooltip} />}
    </div>
    <div className="flex items-center gap-3">
      {tooltip && tooltipPlacement === 'end' && (
        <DashboardHelpTooltip description={tooltip} popupAlign="right" />
      )}
      {trailing}
    </div>
  </div>
);

export default DashboardPanelHeader;
