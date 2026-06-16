import { DatabaseZap } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

const EmptyState = ({ 
  title = "No Intelligence Found", 
  message = "We couldn't find any entries matching your current view. Try refreshing or adjusting your search.",
  className = ""
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center p-20 text-center animate-reveal ${className}`}>
      {/* Visual Indicator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-6 bg-white/5 border border-white/10 rounded-[32px] text-neutral-600">
          <DatabaseZap size={48} strokeWidth={1} />
        </div>
      </div>

      {/* Empty Text */}
      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">
        {title}
      </h3>
      <p className="max-w-sm text-[13px] text-neutral-500 font-medium leading-relaxed">
        {message}
      </p>
      
      {/* Decorative Border to match card feel */}
      <div className="absolute inset-0 border border-white/[0.10] rounded-[40px] pointer-events-none" />
    </div>
  );
};

export default EmptyState;
