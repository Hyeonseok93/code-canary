import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  selectedValues: string; // Comma separated string e.g. "NVD,OSV"
  options: string[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
}

const MultiSelect = ({
  label,
  selectedValues,
  options,
  onChange,
  hideLabel
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Split selected values into an array, filter empty strings
  const activeList = selectedValues
    ? selectedValues.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (option: string) => {
    let nextList: string[];
    if (activeList.includes(option)) {
      // Remove
      nextList = activeList.filter(item => item !== option);
    } else {
      // Add
      nextList = [...activeList, option];
    }
    onChange(nextList.join(','));
  };

  const handleClearAll = () => {
    onChange('');
  };

  // Label text representation
  const getTriggerText = () => {
    if (activeList.length === 0) return 'ALL';
    if (activeList.length === 1) return activeList[0];
    return `${activeList.length} SELECTED`;
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
      {!hideLabel && (
        <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">
          {label}
        </span>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 hover:border-white/30 rounded-xl py-2.5 pl-3 pr-8 text-[11px] font-bold text-white uppercase tracking-tight transition-all cursor-pointer flex items-center min-h-[38px] select-none relative"
      >
        <span className="truncate pr-1">
          {getTriggerText()}
        </span>
        <ChevronDown size={12} className={`text-neutral-500 transition-transform duration-300 absolute right-3 top-1/2 -translate-y-1/2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Cyberpunk Glow Popover Panel */}
      {isOpen && (
        <div className="absolute top-[44px] left-0 w-full bg-[#121214] border border-white/10 rounded-2xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.04)] z-[9999] animate-reveal max-h-60 overflow-y-auto scrollbar-thin">
          <div 
            onClick={handleClearAll}
            className="px-3.5 py-2 text-[10px] font-black text-red-500 border-b border-white/[0.12] hover:bg-[#1c1c1f] cursor-pointer transition-colors uppercase tracking-widest flex items-center justify-between"
          >
            Clear Selection
          </div>
          <div className="mt-1">
            {options.map(opt => {
              const isSelected = activeList.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => handleToggleOption(opt)}
                  className="px-3.5 py-2 text-[11px] font-bold text-neutral-400 hover:text-white hover:bg-[#1c1c1f] cursor-pointer transition-colors uppercase flex items-center justify-between select-none"
                >
                  <span className="truncate pr-2">{opt}</span>
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                      : 'border-white/20'
                  }`}>
                    {isSelected && <Check size={8} strokeWidth={4} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
