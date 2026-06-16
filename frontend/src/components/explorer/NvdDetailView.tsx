import { Cpu, ShieldAlert, RefreshCw } from 'lucide-react';
import type { VulnerabilityDetailResponse } from '../../types/explorer';
import CvssMetricCards from './detail/CvssMetricCards';
import CvssSeverityGauge from './detail/CvssSeverityGauge';
import { formatVulnDate } from '../../utils/dateTime';
import { getSeverityTheme } from '../../utils/severity';
import {
  buildCvssMetricGroups,
  resolveCvssVersion,
  splitMetricGroupsForLayout,
} from '../../utils/cvssMetrics';

interface NvdDetailViewProps {
  data: VulnerabilityDetailResponse;
}

const NvdDetailView = ({ data }: NvdDetailViewProps) => {
  const nvd = data.nvdDetails;
  const theme = getSeverityTheme(data.baseScore);
  const cvssVersion = resolveCvssVersion(nvd?.cvssVersion, nvd?.cvssVector);
  const isCvss40 = cvssVersion === '4.0';
  const allMetricGroups = buildCvssMetricGroups(cvssVersion, nvd?.cvssVector);
  const { headerGroups, bodyGroups } = splitMetricGroupsForLayout(cvssVersion, allMetricGroups);

  return (
    <div className="space-y-8 animate-reveal">
      
      {/* 1. Header: CVSS Neon Radial Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <CvssSeverityGauge baseScore={data.baseScore} severity={data.severity} />

        {/* CVSS Metric Indicators / 4.0 impact cards */}
        <div className="p-6 bg-neutral-950/60 cc-panel-border-soft rounded-3xl col-span-2 flex flex-col justify-center">
          {isCvss40 ? (
            <CvssMetricCards
              groups={headerGroups}
              cvssVersion={cvssVersion}
              compact
            />
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase text-neutral-400">
                  <span>Exploitability Metric</span>
                  <span className="font-mono text-white">
                    {nvd?.exploitabilityScore ? nvd.exploitabilityScore.toFixed(1) : '—'} / 10
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000`}
                    style={{
                      width: `${(nvd?.exploitabilityScore || 0) * 10}%`,
                      boxShadow: `0 0 10px ${theme.stroke}44`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase text-neutral-400">
                  <span>Impact Metric</span>
                  <span className="font-mono text-white">
                    {nvd?.impactScore ? nvd.impactScore.toFixed(1) : '—'} / 10
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-1000`}
                    style={{
                      width: `${(nvd?.impactScore || 0) * 10}%`,
                      boxShadow: `0 0 10px ${theme.stroke}44`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {cvssVersion && !isCvss40 && (
            <div className="pt-2 mt-6 border-t border-white/[0.12] flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
              <span>CVSS Metric Schema</span>
              <span className="text-neutral-400">Version {cvssVersion}</span>
            </div>
          )}
        </div>

      </div>

      {/* 2. Version-specific CVSS metric breakdown */}
      {bodyGroups.length > 0 && (
        <CvssMetricCards groups={bodyGroups} cvssVersion={cvssVersion} />
      )}

      {/* CVSS Vector String Card */}
      {nvd?.cvssVector && (
        <div className="p-5 bg-neutral-950/40 cc-panel-border-soft rounded-3xl space-y-2">
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest pl-1">CVSS Raw Vector String</span>
          <div className="font-mono text-[11px] text-neutral-400 bg-black/60 px-4 py-3 rounded-xl cc-panel-border-soft select-all overflow-x-auto whitespace-nowrap scrollbar-thin">
            {nvd.cvssVector}
          </div>
        </div>
      )}

      {/* 3. CISA KEV Threat Pulse Alert Panel */}
      {data.isKev && (
        <div className="relative overflow-hidden p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] shadow-[0_0_30px_rgba(239,68,68,0.1)] border-dashed">
          <div className="absolute -right-6 -bottom-6 text-red-500 opacity-10 pointer-events-none">
            <ShieldAlert size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            
            {/* Unified Inline Header with larger font sizes */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.12]">
              <div className="flex items-center gap-2.5 text-red-400">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[13px] font-black uppercase tracking-[0.15em]">Active Wildfire Exploit Alert</span>
              </div>
              
              {data.kevDueDate && (
                <div className="px-3 py-1.5 bg-red-500/25 border border-red-500/35 rounded-xl flex items-center gap-2 text-[12px] font-mono font-black text-white uppercase tracking-wider">
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Action Due: {formatVulnDate(data.kevDueDate)}</span>
                </div>
              )}
            </div>

            {/* Required Action Block at the bottom */}
            {data.kevRequiredAction && (
              <div>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-1">CISA Required Action</span>
                <p className="text-[12px] text-neutral-300 leading-relaxed font-bold">
                  {data.kevRequiredAction}
                </p>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* 4. CPE Configurations Directory Tree View */}
      {Array.isArray(nvd?.cpeConfigurations) && nvd.cpeConfigurations.length > 0 && (
        <div className="p-6 bg-neutral-950/60 cc-panel-border-soft rounded-3xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.12]">
            <Cpu size={16} className="text-neutral-400" />
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Affected Platforms & Systems</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            <CpePlatformList configurations={Array.isArray(nvd.cpeConfigurations) ? nvd.cpeConfigurations as CpeNode[] : []} />
          </div>
        </div>
      )}
    </div>
  );
};

// Interface for representing a flattened CPE entry with extended metadata
interface FlattenedCpe {
  vendor: string;
  product: string;
  version: string;
  update: string;
  edition: string;
  targetSw: string;
  startIncl?: string;
  endExcl?: string;
  criteria: string;
}

interface CpeNode {
  criteria?: string;
  cpe23Uri?: string;
  versionStartIncluding?: string;
  versionEndExcluding?: string;
  nodes?: CpeNode[];
  cpeMatch?: CpeNode[];
}

// Flat CPE Platform List Component
const CpePlatformList = ({ configurations }: { configurations: CpeNode[] }) => {
  // Helper function to capitalize string segments nicely
  const formatName = (str: string) => {
    if (!str) return '';
    return str
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to construct a clean human-readable version/update/OS suffix
  const getDisplayLabel = (item: FlattenedCpe) => {
    const base = item.version === '*' || item.version === '-' ? 'All Versions' : item.version;
    
    const extras: string[] = [];
    
    // Add Update / Service Pack info if specific
    if (item.update && item.update !== '*' && item.update !== '-') {
      if (item.update.toLowerCase().startsWith('sp')) {
        extras.push(`Service Pack ${item.update.slice(2) || item.update}`);
      } else {
        extras.push(`Update ${item.update}`);
      }
    }
    
    // Add Target OS / Target Software environment info if specific
    if (item.targetSw && item.targetSw !== '*' && item.targetSw !== '-') {
      extras.push(formatName(item.targetSw));
    }
    
    // Add Edition / Specific build if specific
    if (item.edition && item.edition !== '*' && item.edition !== '-') {
      extras.push(formatName(item.edition));
    }
    
    if (extras.length > 0) {
      return `${base} (${extras.join(', ')})`;
    }
    return base;
  };

  // Flatten the recursive tree nodes to retrieve final leaf matches
  const flattenNodes = (nodes: CpeNode[]): FlattenedCpe[] => {
    const list: FlattenedCpe[] = [];
    const traverse = (node: CpeNode) => {
      if (!node) return;
      if (node.criteria || node.cpe23Uri) {
        const criteria = node.criteria || node.cpe23Uri;
        if (!criteria) return;
        const parts = criteria.split(':');
        // cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
        // index mapping:
        // parts[3] = vendor, parts[4] = product, parts[5] = version, parts[6] = update, parts[7] = edition
        // parts[10] = target_sw
        if (parts.length >= 5) {
          list.push({
            vendor: parts[3] || '',
            product: parts[4] || '',
            version: parts[5] || '',
            update: parts[6] || '',
            edition: parts[7] || '',
            targetSw: parts[10] || '',
            startIncl: node.versionStartIncluding,
            endExcl: node.versionEndExcluding,
            criteria
          });
        }
        return;
      }
      const children = node.nodes || node.cpeMatch || [];
      if (Array.isArray(children)) {
        children.forEach(traverse);
      }
    };
    nodes.forEach(traverse);
    return list;
  };

  const flatList = flattenNodes(configurations);

  if (flatList.length === 0) {
    return <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-center py-4">No mapped platforms detected</div>;
  }

  // Group by vendor & product and deduplicate identical items
  const grouped: Record<string, { vendor: string; product: string; items: FlattenedCpe[] }> = {};
  flatList.forEach(item => {
    const key = `${item.vendor}:${item.product}`;
    if (!grouped[key]) {
      grouped[key] = {
        vendor: item.vendor,
        product: item.product,
        items: []
      };
    }
    
    // Check if an identical display entry already exists to avoid exact duplicates
    const itemLabel = getDisplayLabel(item);
    const hasDuplicate = grouped[key].items.some(existing => {
      const existingLabel = getDisplayLabel(existing);
      return existingLabel === itemLabel &&
             existing.startIncl === item.startIncl &&
             existing.endExcl === item.endExcl;
    });

    if (!hasDuplicate) {
      grouped[key].items.push(item);
    }
  });

  const groupedArray = Object.values(grouped);

  return (
    <div className="space-y-4">
      {groupedArray.map((group, gIdx) => (
        <div 
          key={gIdx} 
          className="p-5 bg-neutral-900/30 cc-panel-border-soft hover:border-white/22 rounded-2xl transition-all duration-300 relative overflow-hidden group/platform"
        >
          {/* Ambient Platform Icon glow */}
          <div className="absolute right-4 top-4 text-white/5 group-hover/platform:text-white/10 transition-colors duration-300">
            <Cpu size={36} />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                {formatName(group.vendor)}
              </span>
              <h4 className="text-[15px] font-black text-white uppercase tracking-tight">
                {formatName(group.product)}
              </h4>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item, itemIdx) => {
                const hasRange = item.startIncl || item.endExcl;
                const displayLabel = getDisplayLabel(item);
                
                return (
                  <div 
                    key={itemIdx} 
                    className="group/chip relative flex flex-col gap-1 px-3 py-2 bg-neutral-950/60 cc-panel-border-soft rounded-xl hover:border-white/28 transition-all text-left"
                    title={item.criteria}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-neutral-200">
                        {displayLabel}
                      </span>
                    </div>

                    {hasRange && (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-mono text-neutral-500 uppercase">
                        {item.startIncl && (
                          <span>
                            &ge; <span className="text-neutral-400 font-black">{item.startIncl}</span>
                          </span>
                        )}
                        {item.endExcl && (
                          <span>
                            &lt; <span className="text-neutral-400 font-black">{item.endExcl}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NvdDetailView;
