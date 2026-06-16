import { AlertCircle } from 'lucide-react';
import { formatVulnDate } from '../../utils/dateTime';

interface KevBadgeProps {
  dueDate?: string | null;
  variant?: 'compact' | 'detailed';
}

const KevBadge = ({ dueDate, variant = 'detailed' }: KevBadgeProps) => {
  if (variant === 'compact') {
    return (
      <div className="flex md:hidden items-center gap-1 text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
        <AlertCircle size={8} strokeWidth={3} />
        <span className="text-[8px] font-black uppercase tracking-tighter">KEV</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
      <AlertCircle size={12} strokeWidth={3} />
      <span className="text-[11px] font-black uppercase tracking-widest">KEV</span>
      <div className="w-[1px] h-3 bg-red-500/30 mx-0.5" />
      <span className="text-[11px] font-bold uppercase">Due : {formatVulnDate(dueDate, 'Immediate')}</span>
    </div>
  );
};

export default KevBadge;
