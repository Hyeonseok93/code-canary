import { ChevronRight } from 'lucide-react';

interface WeaknessPillarCardProps {
  pillar: string;
  count: number;
  percentage: number;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

const WeaknessPillarCard = ({ 
  pillar, count, percentage, isActive, onClick, color 
}: WeaknessPillarCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition-all duration-500 group relative overflow-hidden flex items-center justify-between ${
        isActive 
          ? 'bg-white/10 border-white/20' 
          : 'bg-neutral-900/40 border-white/[0.12] hover:bg-neutral-900/60 hover:border-white/22'
      }`}
    >
      <div className="flex flex-col gap-1 z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${
            isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
          }`}>
            {pillar}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white tracking-tighter">
            {count.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-neutral-600">
            {percentage}%
          </span>
        </div>
      </div>

      <ChevronRight 
        size={18} 
        className={`transition-all duration-500 ${
          isActive ? 'text-white translate-x-0 opacity-100' : 'text-neutral-700 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
        }`} 
      />

      {/* Background Accent for Active State */}
      {isActive && (
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundColor: color }} 
        />
      )}
    </button>
  );
};

export default WeaknessPillarCard;
