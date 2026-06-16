import { HelpCircle } from 'lucide-react';

interface DashboardHelpTooltipProps {
  description: string;
  popupAlign?: 'left' | 'right';
  className?: string;
}

const DashboardHelpTooltip = ({
  description,
  popupAlign = 'left',
  className = 'relative z-30',
}: DashboardHelpTooltipProps) => (
  <div className={`group/tooltip ${className}`}>
    <HelpCircle size={14} className="text-neutral-600 hover:text-white transition-colors cursor-help" />
    <div
      className={`absolute bottom-full mb-2 w-64 p-3 bg-neutral-950/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md opacity-0 scale-95 translate-y-1 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:translate-y-0 transition-all duration-200 z-50 ${popupAlign === 'right' ? 'right-0' : 'left-0'}`}
    >
      <p className="text-[11px] leading-relaxed font-bold text-neutral-400 normal-case tracking-wide">
        {description}
      </p>
    </div>
  </div>
);

export default DashboardHelpTooltip;
