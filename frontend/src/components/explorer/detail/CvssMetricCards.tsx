import {
  type CvssMetricCardData,
  type CvssMetricGroupData,
  type CvssVersion,
  getMetricGroupGridClass,
  getMetricSeverityStyles,
} from '../../../utils/cvssMetrics';

interface CvssMetricCardsProps {
  groups: CvssMetricGroupData[];
  cvssVersion?: CvssVersion | null;
  compact?: boolean;
}

const CARD_MIN_H = { normal: 'min-h-[148px]', compact: 'min-h-[128px]' } as const;

const CvssMetricCard = ({
  metric,
  compact = false,
}: {
  metric: CvssMetricCardData;
  compact?: boolean;
}) => {
  const Icon = metric.icon;
  const styles = getMetricSeverityStyles(metric.severity);
  const isMissing = metric.missing === true;
  const minH = compact ? CARD_MIN_H.compact : CARD_MIN_H.normal;

  return (
    <div
      className={`${compact ? 'p-4' : 'p-5'} h-full ${minH} rounded-2xl flex flex-col relative overflow-hidden min-w-0 ${
        isMissing
          ? 'bg-neutral-950/20 border border-dashed border-neutral-700/50 opacity-60'
          : `bg-neutral-950/40 cc-panel-border-soft ${styles.border} ${styles.glow} transition-all duration-300 group/card hover:scale-[1.02] hover:-translate-y-0.5`
      }`}
    >
      {!isMissing && (
        <div
          className={`absolute -right-8 -bottom-8 w-20 h-20 rounded-full ${styles.bg} blur-2xl opacity-40 pointer-events-none group-hover/card:scale-150 transition-transform duration-500`}
        />
      )}
      <div className="flex justify-between items-start w-full relative z-10 gap-2">
        <span
          className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-black uppercase tracking-widest ${
            isMissing ? 'text-neutral-600' : 'text-neutral-500'
          }`}
        >
          {metric.label}
        </span>
        <div
          className={`p-1.5 rounded-lg border shrink-0 ${
            isMissing
              ? 'bg-neutral-900/40 border-neutral-700/40'
              : `${styles.bg} border-white/[0.12] transition-transform duration-300 group-hover/card:rotate-6`
          }`}
        >
          <Icon
            className={`${isMissing ? 'text-neutral-600' : styles.text} transition-colors duration-300`}
            size={compact ? 14 : 16}
          />
        </div>
      </div>
      <div className="mt-2 relative z-10">
        <h5
          className={`${compact ? 'text-[15px]' : 'text-[17px]'} font-black uppercase leading-none tracking-tight`}
        >
          <span className={isMissing ? 'text-neutral-600' : styles.text}>{metric.value}</span>
        </h5>
      </div>
      <div className={`mt-auto ${compact ? 'pt-2 min-h-[36px]' : 'pt-3 min-h-[40px]'} flex items-end relative z-10`}>
        <p
          className={`${compact ? 'text-[10px]' : 'text-[11px]'} leading-normal font-medium ${
            isMissing ? 'text-neutral-600 italic' : 'text-neutral-400'
          }`}
        >
          {metric.desc}
        </p>
      </div>
    </div>
  );
};

const CvssMetricCards = ({
  groups,
  cvssVersion = null,
  compact = false,
}: CvssMetricCardsProps) => {
  if (groups.length === 0) return null;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {groups.map((group) => (
        <div key={group.title} className="space-y-3 w-full">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] block pl-1">
            {group.title}
          </span>
          <div className={`${getMetricGroupGridClass(cvssVersion, group.title)} items-stretch w-full`}>
            {group.metrics.map((metric) => (
              <CvssMetricCard key={`${group.title}-${metric.label}`} metric={metric} compact={compact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CvssMetricCards;
