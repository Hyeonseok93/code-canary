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

const PILLAR_STYLES: Record<string, { dot: string; accent: string }> = {
  'ALL': { dot: 'pillar-dot-all', accent: 'pillar-accent-all' },
  'Injection & Input Validation': { dot: 'pillar-dot-injection', accent: 'pillar-accent-injection' },
  'Memory Safety': { dot: 'pillar-dot-memory', accent: 'pillar-accent-memory' },
  'Auth & Access Control': { dot: 'pillar-dot-auth', accent: 'pillar-accent-auth' },
  'Crypto & Data Security': { dot: 'pillar-dot-crypto', accent: 'pillar-accent-crypto' },
  'Resource Management': { dot: 'pillar-dot-resource', accent: 'pillar-accent-resource' },
  'Logic & Design Errors': { dot: 'pillar-dot-logic', accent: 'pillar-accent-logic' },
  'Others & Unclassified': { dot: 'pillar-dot-others', accent: 'pillar-accent-others' },
  'Not Specified': { dot: 'pillar-dot-unspecified', accent: 'pillar-accent-unspecified' },
};

const defaultPillarStyle = { dot: 'pillar-dot-others', accent: 'pillar-accent-others' };

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
                dotClassName={PILLAR_STYLES.ALL.dot}
                accentClassName={PILLAR_STYLES.ALL.accent}
              />
              {data?.pillars.map((p) => {
                const styles = PILLAR_STYLES[p.pillar] ?? defaultPillarStyle;
                return (
                <WeaknessPillarCard 
                  key={p.pillar}
                  pillar={p.pillar}
                  count={p.count}
                  percentage={p.percentage}
                  isActive={selectedPillar === p.pillar}
                  onClick={() => setSelectedPillar(p.pillar)}
                  dotClassName={styles.dot}
                  accentClassName={styles.accent}
                />
              );})}
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
