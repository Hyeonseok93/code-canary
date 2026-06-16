import { useState } from 'react';
import { Box, Copy, Check, Info, Terminal } from 'lucide-react';
import type { VulnerabilityDetailResponse } from '../../types/explorer';
import CvssMetricCards from './detail/CvssMetricCards';
import CvssSeverityGauge from './detail/CvssSeverityGauge';
import { buildOsvMetricGroups } from '../../utils/osvMetrics';
import {
  buildOsvRemediationGuide,
  formatOsvVersionLabel,
  parseOsvVersionRange,
} from '../../utils/osvRemediation';

interface OsvDetailViewProps {
  data: VulnerabilityDetailResponse;
}

const OsvDetailView = ({ data }: OsvDetailViewProps) => {
  const osv = data.osvDetails;
  const affected = osv?.affected ?? [];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const metricGroups = buildOsvMetricGroups(data);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 animate-reveal">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CvssSeverityGauge baseScore={data.baseScore} severity={data.severity} />

        <div className="p-6 bg-neutral-950/60 cc-panel-border-soft rounded-3xl col-span-2 flex flex-col justify-center w-full min-w-0">
          <CvssMetricCards groups={metricGroups} compact />
        </div>
      </div>

      {affected.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-950/40 cc-panel-border-soft rounded-3xl">
          No affected packages mapping found.
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block pl-1">
            Affected Packages & Remediation
          </span>
          <div className="max-h-[680px] overflow-y-auto custom-scrollbar pr-1 space-y-6">
            {affected.map((aff, index) => {
              const versionRange = parseOsvVersionRange(aff.ranges);
              const ecoConfig = buildOsvRemediationGuide(
                aff.ecosystem,
                aff.packageName,
                versionRange,
                data.vulnId,
              );
              const introducedLabel = formatOsvVersionLabel(versionRange.introduced);
              const patchLabel = ecoConfig.patchLabel;
              const isUnpatched = !versionRange.hasFixedVersion && !/^MAL-/i.test(data.vulnId);

              return (
                <div key={index} className="p-6 bg-neutral-950/60 cc-panel-border-soft rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.12] pb-4">
                    <div className="flex items-center gap-3">
                      <Box size={22} className="text-neutral-400" />
                      <div>
                        <h4 className="text-[15px] font-black text-white font-mono leading-none">
                          {aff.packageName}
                        </h4>
                        {aff.purl && (
                          <span className="text-[10px] font-mono text-neutral-500 truncate block max-w-sm mt-1">
                            {aff.purl}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`self-start sm:self-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${ecoConfig.badgeClass}`}
                    >
                      {ecoConfig.brandName}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block pl-1">
                      Version Release Timeline
                    </span>
                    <div className="relative p-4 sm:p-6 bg-black/40 rounded-2xl cc-panel-border-soft flex flex-row items-center justify-between gap-3 sm:gap-6 overflow-x-auto custom-scrollbar">
                      <div className="absolute inset-0 bg-radial from-white/[0.01] to-transparent pointer-events-none" />

                      <div className="flex flex-col items-start text-left z-10 shrink-0">
                        <span className="text-[8px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest">
                          Introduced
                        </span>
                        <span className="text-[10px] sm:text-[14px] font-black text-white mt-1 font-mono bg-red-500/10 px-2 sm:px-3 py-0.5 sm:py-1 border border-red-500/20 rounded-xl whitespace-nowrap">
                          {introducedLabel}
                        </span>
                      </div>

                      <div className="flex-grow h-[2px] bg-gradient-to-r from-red-500/30 to-emerald-500/30 min-w-[30px] sm:min-w-[60px] z-0 shrink-0" />

                      <div className="flex flex-col items-end text-right z-10 shrink-0">
                        <span
                          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                            isUnpatched ? 'text-amber-500' : 'text-emerald-500'
                          }`}
                        >
                          {isUnpatched ? 'Fix Status' : 'Patch Version'}
                        </span>
                        <span
                          className={`text-[10px] sm:text-[14px] font-black text-white mt-1 font-mono px-2 sm:px-3 py-0.5 sm:py-1 border rounded-xl whitespace-nowrap ${
                            isUnpatched
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/20'
                          }`}
                        >
                          {patchLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block pl-1">
                      Remediation Actions Terminal
                    </span>
                    <div className="cc-panel-border-soft rounded-2xl overflow-hidden bg-black/60 shadow-2xl flex flex-col">
                      <div className="flex items-center justify-between bg-neutral-900/60 px-4 py-2.5 border-b border-white/[0.12]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <Terminal size={12} />
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest">
                            Remediation Shell
                          </span>
                        </div>
                        <div className="w-8" />
                      </div>

                      <div className="p-4 bg-neutral-900/10 border-b border-white/[0.12] flex gap-2">
                        <Info size={14} className="text-neutral-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-neutral-400 leading-relaxed">{ecoConfig.guide}</p>
                      </div>

                      <div className="relative group/code p-4">
                        <pre className="text-[11px] font-mono text-neutral-300 overflow-x-auto whitespace-pre select-all leading-relaxed">
                          {ecoConfig.code}
                        </pre>
                        <button
                          type="button"
                          onClick={() => handleCopy(ecoConfig.code, index)}
                          className="absolute right-3 top-3 p-2 bg-neutral-900 hover:bg-neutral-800 border border-white/20 hover:border-white/30 text-neutral-400 hover:text-white rounded-xl transition-all"
                          title="Copy commands"
                        >
                          {copiedIndex === index ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
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

export default OsvDetailView;
