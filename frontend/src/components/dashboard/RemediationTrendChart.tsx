import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { RemediationAnalytics } from '../../types/analytics';
import { REMEDIATION_COLORS } from '../../constants/dashboardConstants';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

interface RemediationTrendChartProps {
  data: RemediationAnalytics | undefined;
  isLoading: boolean;
  isError: boolean;
}

interface YearData {
  year: number;
  [key: string]: number | string;
}

interface ChartData {
  series: YearData[];
}

// 명확한 툴팁 페이로드 아이템 타입 정의
interface TooltipPayloadItem {
  payload: YearData;
  value: number;
  name: string;
  color: string;
}

// 툴팁 타입 에러 해결을 위한 전용 인터페이스 (any 제거)
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const yearData = payload[0].payload;
    const items = [];
    for (let i = 0; i < 6; i++) {
      const name = yearData[`rank${i}_cat`] as string;
      const val = yearData[`rank${i}_count`] as number;
      if (name && name !== 'Unknown' && val > 0) {
        items.push({ label: name, value: val, color: REMEDIATION_COLORS[name] || '#333' });
      }
    }
    // 툴팁도 데이터가 큰 순서대로 정렬
    items.sort((a, b) => b.value - a.value);

    return (
      <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', padding: '12px', minWidth: '150px' }}>
        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>{label}</p>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
            <span style={{ color: '#aaa', fontSize: '10px', fontWeight: 'bold' }}>{item.label}</span>
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', marginLeft: 'auto' }}>{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RemediationTrendChart = ({ data, isLoading, isError }: RemediationTrendChartProps) => {
  const chartData = useMemo<ChartData>(() => {
    if (!data?.trends) return { series: [] };

    const yearMap: Record<number, Record<string, number>> = {};
    data.trends.forEach(item => {
      if (!yearMap[item.year]) yearMap[item.year] = {};
      yearMap[item.year][item.label] = item.count;
    });

    const sortedYears = Object.keys(yearMap).map(Number).sort((a, b) => a - b).slice(-15);
    
    const series = sortedYears.map(year => {
      const yearData = yearMap[year];
      // 연도별 독립 정렬: 작은 것 -> 큰 것 순 (큰 것이 나중에 그려져서 위에 쌓임)
      const sorted = Object.keys(yearData).sort((a, b) => yearData[a] - yearData[b]);
      
      while (sorted.length < 6) { sorted.unshift('Unknown'); }

      const result: YearData = { year };
      sorted.forEach((cat, i) => {
        result[`rank${i}_count`] = cat === 'Unknown' ? 0 : yearData[cat];
        result[`rank${i}_cat`] = cat;
      });
      return result;
    });

    return { series };
  }, [data]);

  const dataReady = !isLoading && !isError && !!data?.trends?.length;
  const { containerRef, dimensions, isReady } = useContainerDimensions({
    dataReady,
    readyDelayMs: 200,
  });

  return (
    <div className="lg:col-span-2 bg-neutral-900/40 cc-panel-border p-8 rounded-[32px] h-[480px] flex flex-col relative overflow-visible min-w-0 min-h-0">
      <DashboardPanelHeader
        title="Remediation Maturity Trend"
        accentClassName="bg-blue-500"
        tooltip="Yearly trend of remediation statuses (Patch, EOL, etc.) for published vulnerabilities. Shows how remediation availability has evolved historically."
      />
      <div className="flex-grow min-w-0 min-h-0 relative" ref={containerRef}>
        {isError ? (
          <ErrorState variant="placeholder" {...DEFAULT_PLACEHOLDER_ERROR} className="flex-grow" />
        ) : isLoading ? (
          <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8 animate-skeleton">
            <div className="flex-grow border-b border-dashed border-white/[0.12] relative" />
          </div>
        ) : (
          <div className="absolute inset-0">
            {!isReady || dimensions.width <= 0 || dimensions.height <= 0 ? (
              <div className="w-full h-full" />
            ) : (
              <div className="h-full w-full animate-reveal">
                <BarChart width={dimensions.width} height={dimensions.height} data={chartData.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  {[0, 1, 2, 3, 4, 5].map(r => (
                    <Bar key={r} dataKey={`rank${r}_count`} stackId="a" isAnimationActive={false} radius={r === 5 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                      {chartData.series.map((entry, i) => (
                        <Cell key={i} fill={REMEDIATION_COLORS[entry[`rank${r}_cat`] as string] || 'transparent'} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RemediationTrendChart;
