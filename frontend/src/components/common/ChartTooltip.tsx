import { chartSeriesDotClass } from '../../utils/chartColorClasses';

export interface ChartTooltipItem {
  label: string;
  value: number;
  colorIndex?: number;
  dotClassName?: string;
}

interface ChartTooltipProps {
  title?: string | number;
  items: ChartTooltipItem[];
}

const ChartTooltip = ({ title, items }: ChartTooltipProps) => (
  <div className="chart-tooltip">
    {title != null && <p className="chart-tooltip-title">{title}</p>}
    {items.map((item, idx) => (
      <div key={`${item.label}-${idx}`} className="chart-tooltip-row">
        <div
          className={`chart-tooltip-dot ${
            item.dotClassName ?? chartSeriesDotClass(item.colorIndex ?? idx)
          }`}
        />
        <span className="chart-tooltip-label">{item.label}</span>
        <span className="chart-tooltip-value">{item.value.toLocaleString()}</span>
      </div>
    ))}
  </div>
);

export default ChartTooltip;
