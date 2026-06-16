import { ShieldAlert } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  className?: string;
  variant?: 'alert' | 'placeholder';
}

const ErrorState = ({
  title,
  message,
  className = '',
  variant = 'alert',
}: ErrorStateProps) => {
  if (variant === 'placeholder') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center animate-reveal ${className}`}>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
            <ShieldAlert size={32} strokeWidth={1.5} />
          </div>
        </div>
        <h4 className="text-[11px] font-black text-red-500/80 uppercase tracking-[0.2em] mb-3">{title}</h4>
        <p className="max-w-[240px] text-[13px] text-neutral-500 font-medium leading-relaxed tracking-tight">
          {message}
        </p>
        <div className="absolute inset-0 border border-red-500/5 rounded-[32px] pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`text-center py-24 space-y-4 bg-neutral-900/40 border border-white/[0.06] rounded-[32px] shadow-2xl ${className}`}
    >
      <ShieldAlert className="mx-auto text-red-500 animate-bounce" size={48} />
      <h4 className="text-lg font-black text-white uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">{message}</p>
    </div>
  );
};

export default ErrorState;
