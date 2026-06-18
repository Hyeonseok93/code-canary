import { Package, ShieldAlert, Activity, Zap, TrendingUp, ShieldOff, Database, Clock } from 'lucide-react';
import MetricCard from './MetricCard';
import type { SummaryMetricsResponse } from '../../hooks/useMetrics';

interface MetricsGridProps {
  metrics: SummaryMetricsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}

const MetricsGrid = ({ metrics, isLoading, isError }: MetricsGridProps) => {
  const metricConfigs = [
    { 
      key: 'total_intelligence', 
      label: 'Total Intelligence', 
      icon: <Package size={24} />, 
      color: 'text-blue-400', 
      glow: 'group-hover:bg-blue-500/10',
      description: 'Deduplicated count of all vulnerability records aggregated from NVD (CVEs) and OSV (non-CVEs, GHSAs, malware lists).'
    },
    { 
      key: 'active_exploits', 
      label: 'Active Exploits', 
      icon: <ShieldAlert size={24} />, 
      color: 'text-red-500', 
      glow: 'group-hover:bg-red-500/10',
      description: 'Total vulnerabilities registered in the CISA KEV list, confirmed to be actively exploited in the wild.'
    },
    { 
      key: 'critical_weaknesses', 
      label: 'Critical Weaknesses', 
      icon: <Activity size={24} />, 
      color: 'text-orange-500', 
      glow: 'group-hover:bg-orange-500/10',
      description: 'Total high-risk vulnerabilities with a CVSS score of 9.0 or higher, classified as Critical severity.'
    },
    { 
      key: 'new_discoveries', 
      label: 'New Discoveries', 
      icon: <Zap size={24} />, 
      color: 'text-emerald-400', 
      glow: 'group-hover:bg-emerald-500/10',
      description: 'Newly discovered and published vulnerability records in the intelligence catalog within the last 24 hours.'
    },
    { 
      key: 'recent_updates', 
      label: 'Recent Updates', 
      icon: <TrendingUp size={24} />, 
      color: 'text-cyan-400', 
      glow: 'group-hover:bg-cyan-500/10',
      description: 'Previously existing vulnerability records that have been modified, updated, or re-analyzed in the last 24 hours.'
    },
    { 
      key: 'unpatched_threats', 
      label: 'Unpatched Threats', 
      icon: <ShieldOff size={24} />, 
      color: 'text-neutral-300', 
      glow: 'group-hover:bg-white/5',
      description: 'Active vulnerabilities classified as having no available patch, official solution, or workaround.'
    },
    { 
      key: 'analysis_backlog', 
      label: 'Analysis Backlog', 
      icon: <Database size={24} />, 
      color: 'text-neutral-400', 
      glow: 'group-hover:bg-white/5',
      description: 'Vulnerabilities currently in the NVD queue awaiting analysis or undergoing analysis.'
    },
    { 
      key: 'intelligence_span', 
      label: 'Intelligence Span', 
      icon: <Clock size={24} />, 
      color: 'text-indigo-400', 
      glow: 'group-hover:bg-indigo-500/10',
      description: 'The total chronological span of vulnerability data in years, calculated from the oldest publication date (post-1970) to the current year.'
    },
  ];

  const formatValue = (key: string, val: number | undefined) => {
    if (val === undefined || val === null) return undefined;
    const formattedNum = val.toLocaleString();
    if (key === 'intelligence_span') return `${formattedNum} Years`;
    return formattedNum;
  };

  return (
    <div className="animate-reveal reveal-delay-400">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {metricConfigs.map((config) => (
          <MetricCard
            key={config.key}
            label={config.label}
            value={formatValue(config.key, metrics?.metrics?.[config.key])}
            icon={config.icon}
            colorClass={config.color}
            glowClass={config.glow}
            isLoading={isLoading}
            isError={isError}
            description={config.description}
          />
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;