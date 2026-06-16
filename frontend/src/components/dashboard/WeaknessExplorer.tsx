import { useState } from 'react';
import WeaknessPillarCard from './WeaknessPillarCard';
import WeaknessDetailTable from './WeaknessDetailTable';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { WeaknessAnalytics } from '../../types/analytics';

interface WeaknessExplorerProps {
  data: WeaknessAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
}

const PILLAR_COLORS: Record<string, string> = {
  'Injection & Input Validation': '#3B82F6',
  'Memory Safety': '#EF4444',
  'Auth & Access Control': '#F97316',
  'Crypto & Data Security': '#10B981',
  'Resource Management': '#8B5CF6',
  'Logic & Design Errors': '#F59E0B',
  'Others & Unclassified': '#64748B',
  'Not Specified': '#333333'
};

const WeaknessExplorer = ({ data, isLoading, isError }: WeaknessExplorerProps) => {
  const [selectedPillar, setSelectedPillar] = useState<string>('Total');

  if (isError) {
    return (
      <div className="bg-neutral-900/40 border border-white/[0.14] rounded-[32px] p-12 min-h-[600px] flex flex-col items-center justify-center">
        <ErrorState variant="placeholder" {...DEFAULT_PLACEHOLDER_ERROR} />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/40 border border-white/[0.14] rounded-[32px] overflow-visible min-h-[700px] flex flex-col relative">
      <div className="p-8 border-b border-white/[0.14]">
        <DashboardPanelHeader
          title="Weakness Explorer (CWE Analysis)"
          accentClassName="bg-indigo-500"
          tooltip="Interactive exploration map of vulnerabilities grouped by Common Weakness Enumeration (CWE) categories. Displays hierarchical vulnerability mappings."
          trailing={
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full cc-panel-border-soft">
              Hierarchical Intel
            </span>
          }
          className="mb-0"
        />
      </div>

      <div className="flex flex-col lg:flex-row flex-grow">
        {/* Left: Pillar Navigation - Restored to 1/3 */}
        <div className="lg:w-1/3 p-6 border-r border-white/[0.14] space-y-3 bg-black/20">
          <div className="mb-4 pl-2">
            <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">Select Category</span>
          </div>
          
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-24 bg-white/5 rounded-2xl animate-skeleton" />
            ))
          ) : (
            <>
              {/* Total Pillar (Special Case) */}
              <WeaknessPillarCard 
                pillar="ALL"
                count={data?.details.reduce((sum, item) => sum + item.count, 0) || 0}
                percentage={100}
                isActive={selectedPillar === 'Total'}
                onClick={() => setSelectedPillar('Total')}
                color="#FFFFFF"
              />
              {data?.pillars.map((p) => (
                <WeaknessPillarCard 
                  key={p.pillar}
                  pillar={p.pillar}
                  count={p.count}
                  percentage={p.percentage}
                  isActive={selectedPillar === p.pillar}
                  onClick={() => setSelectedPillar(p.pillar)}
                  color={PILLAR_COLORS[p.pillar] || '#666'}
                />
              ))}
            </>
          )}
        </div>

        {/* Right: Detailed Analysis Table - Restored to 2/3 but reduced horizontal padding */}
        <div className="lg:w-2/3 px-4 py-8 flex flex-col bg-[#0d0d0d]/40">
          {isLoading ? (
            <div className="flex-grow space-y-4 pt-12">
              <div className="w-full h-8 bg-white/5 rounded-xl animate-skeleton" />
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-full h-6 bg-white/5 rounded animate-skeleton" />
              ))}
            </div>
          ) : (
            <WeaknessDetailTable 
              data={data?.details || []} 
              selectedPillar={selectedPillar} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WeaknessExplorer;
