import type { MouseEvent } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import MultiSelect from '../dashboard/MultiSelect';
import type { ExplorerFilters } from '../../types/explorer';
import {
  EXPLORER_ECOSYSTEM_OPTIONS,
  EXPLORER_PILLAR_OPTIONS,
  EXPLORER_REMEDIATION_OPTIONS,
  EXPLORER_SEVERITY_OPTIONS,
  EXPLORER_SOURCE_OPTIONS,
  EXPLORER_STATUS_OPTIONS,
  EXPLORER_VECTOR_OPTIONS,
} from '../../constants/explorerFilters';

interface ExplorerFilterPanelProps {
  filters: ExplorerFilters;
  onFilterChange: (key: keyof ExplorerFilters, value: string | boolean) => void;
  variant?: 'hero' | 'page';
}

const VARIANT_CLASSES: Record<NonNullable<ExplorerFilterPanelProps['variant']>, string> = {
  hero: 'lg:absolute lg:top-full lg:left-0 lg:w-[1184px] lg:-translate-x-[424px] mt-6 flex flex-col gap-6 p-8 bg-white/[0.03] border border-white/10 rounded-[40px] animate-reveal shadow-2xl z-40 backdrop-blur-xl',
  page: 'relative z-30 flex flex-col gap-6 mb-12 p-8 bg-white/[0.02] cc-panel-border-soft rounded-[40px] animate-reveal shadow-2xl',
};

const ExplorerFilterPanel = ({
  filters,
  onFilterChange,
  variant = 'page',
}: ExplorerFilterPanelProps) => {
  const openDatePicker = (e: MouseEvent<HTMLDivElement>) => {
    const input = e.currentTarget.querySelector('input');
    if (input && 'showPicker' in input) {
      (input as HTMLInputElement).showPicker();
    }
  };

  return (
    <div className={VARIANT_CLASSES[variant]}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MultiSelect
          label="Severity"
          selectedValues={filters.severity || ''}
          options={[...EXPLORER_SEVERITY_OPTIONS]}
          onChange={(v) => onFilterChange('severity', v)}
        />
        <MultiSelect
          label="Source"
          selectedValues={filters.source || ''}
          options={[...EXPLORER_SOURCE_OPTIONS]}
          onChange={(v) => onFilterChange('source', v)}
        />
        <MultiSelect
          label="Vector"
          selectedValues={filters.vector || ''}
          options={[...EXPLORER_VECTOR_OPTIONS]}
          onChange={(v) => onFilterChange('vector', v)}
        />
        <MultiSelect
          label="Status"
          selectedValues={filters.status || ''}
          options={[...EXPLORER_STATUS_OPTIONS]}
          onChange={(v) => onFilterChange('status', v)}
        />
        <MultiSelect
          label="Remediation"
          selectedValues={filters.remediation || ''}
          options={[...EXPLORER_REMEDIATION_OPTIONS]}
          onChange={(v) => onFilterChange('remediation', v)}
        />
      </div>

      <div className="flex flex-col lg:flex-row items-end gap-6 pt-4 border-t border-white/[0.12]">
        <div className="flex flex-col gap-2 w-full lg:w-72">
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">Weakness</span>
          <MultiSelect
            label=""
            selectedValues={filters.pillar || ''}
            options={[...EXPLORER_PILLAR_OPTIONS]}
            onChange={(v) => onFilterChange('pillar', v)}
            hideLabel
          />
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-64">
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">Ecosystem</span>
          <MultiSelect
            label=""
            selectedValues={filters.ecosystem || ''}
            options={[...EXPLORER_ECOSYSTEM_OPTIONS]}
            onChange={(v) => onFilterChange('ecosystem', v)}
            hideLabel
          />
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">Publication Range</span>
          <div className="flex items-center gap-2">
            <div className="relative group/date cursor-pointer" onClick={openDatePicker}>
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/date:text-white transition-colors"
                size={14}
              />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                className="bg-white/5 border border-white/20 rounded-xl py-2 pl-9 pr-3 text-[11px] font-bold text-white focus:outline-none focus:border-white/30 transition-all cursor-pointer w-full"
              />
            </div>
            <span className="text-neutral-600 font-bold">—</span>
            <div className="relative group/date cursor-pointer" onClick={openDatePicker}>
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within/date:text-white transition-colors"
                size={14}
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                className="bg-white/5 border border-white/20 rounded-xl py-2 pl-9 pr-3 text-[11px] font-bold text-white focus:outline-none focus:border-white/30 transition-all cursor-pointer w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex-grow" />

        <button
          type="button"
          onClick={() => onFilterChange('isKev', !filters.isKev)}
          className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all duration-300 ${filters.isKev ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-neutral-500 hover:border-white/30'}`}
        >
          <AlertCircle size={18} strokeWidth={filters.isKev ? 3 : 2} />
          <span className="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">CISA KEV ONLY</span>
          <div
            className={`w-10 h-5 rounded-full relative transition-colors duration-300 flex-shrink-0 ${filters.isKev ? 'bg-red-500' : 'bg-neutral-800'}`}
          >
            <div
              className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${filters.isKev ? 'left-6' : 'left-1'}`}
            />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExplorerFilterPanel;
