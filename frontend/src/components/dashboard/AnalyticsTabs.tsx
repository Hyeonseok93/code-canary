import type { ReactNode } from 'react';
import { Database, ShieldCheck, Map, Box, Bug, Wrench } from 'lucide-react';

export type DashboardTab = 'source' | 'severity' | 'vector' | 'ecosystem' | 'weakness' | 'remediation';

interface AnalyticsTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const AnalyticsTabs = ({ activeTab, onTabChange }: AnalyticsTabsProps) => {
  const tabs: { id: DashboardTab; label: string; icon: ReactNode }[] = [
    { id: 'source', label: 'Source Profile', icon: <Database size={18} /> },
    { id: 'severity', label: 'Risk Profile', icon: <ShieldCheck size={18} /> },
    { id: 'vector', label: 'Attack Vector', icon: <Map size={18} /> },
    { id: 'remediation', label: 'Remediation', icon: <Wrench size={18} /> },
    { id: 'ecosystem', label: 'Ecosystem', icon: <Box size={18} /> },
    { id: 'weakness', label: 'Weakness', icon: <Bug size={18} /> },
  ];

  return (
    <div className="w-full mb-8 animate-reveal animation-delay-500">
      <div className="flex items-center gap-3 overflow-x-auto lg:overflow-x-visible pb-4 sm:pb-0 lg:justify-between no-scrollbar-hide">
        <div className="flex items-center gap-3 w-full no-scrollbar-hide flex-nowrap lg:flex-wrap lg:justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-shrink-0 lg:flex-1 flex items-center justify-center gap-2.5 px-4 py-3 sm:py-4 rounded-2xl border transition-all duration-300 font-black text-[12px] sm:text-[12px] uppercase tracking-widest min-w-[120px] lg:min-w-0 ${
                activeTab === tab.id
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-[1.02]'
                  : 'bg-neutral-900/40 text-neutral-500 border-white/[0.12] hover:border-white/30 hover:text-neutral-300'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline-block lg:hidden xl:inline-block">{tab.label}</span>
              <span className="sm:hidden lg:inline-block xl:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTabs;