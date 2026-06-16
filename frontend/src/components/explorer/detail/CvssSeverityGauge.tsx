import { getSeverityTheme } from '../../../utils/severity';

interface CvssSeverityGaugeProps {
  baseScore: number;
  severity: string;
}

const CvssSeverityGauge = ({ baseScore, severity }: CvssSeverityGaugeProps) => {
  const theme = getSeverityTheme(baseScore);
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((baseScore || 0) / 10) * circumference;

  return (
    <div
      className={`p-6 bg-neutral-950/60 cc-panel-border-soft rounded-3xl flex flex-col items-center justify-center relative overflow-hidden ${theme.glow}`}
    >
      <div className="absolute inset-0 bg-radial from-white/[0.01] to-transparent pointer-events-none" />

      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.18em] mb-3 block">
        Vulnerability Severity
      </span>

      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            className="stroke-neutral-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${theme.stroke}66)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">
            {baseScore > 0 ? baseScore.toFixed(1) : '—'}
          </span>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">CVSS Score</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${theme.text} ${theme.border} ${theme.bg}`}
        >
          {severity}
        </span>
      </div>
    </div>
  );
};

export default CvssSeverityGauge;
