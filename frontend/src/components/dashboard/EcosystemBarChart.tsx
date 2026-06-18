import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import ErrorState from '../common/ErrorState';
import { DEFAULT_PLACEHOLDER_ERROR } from '../../constants/errorState';
import DashboardPanelHeader from './DashboardPanelHeader';
import type { EcosystemTrend } from '../../types/analytics';
import ChartTooltip from '../common/ChartTooltip';
import { ECOSYSTEM_COLORS } from '../../constants/dashboardConstants';
import { ecosystemDotClass } from '../../utils/chartColorClasses';
import { useContainerDimensions } from '../../hooks/useContainerDimensions';

interface EcosystemBarChartProps {
  data: EcosystemTrend[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

interface EcosystemYearData {
  year: number;
  [key: string]: number | string;
}

interface EcosystemChartData {
  series: EcosystemYearData[];
  maxRanks: number;
}

// 명확한 툴팁 페이로드 아이템 타입 정의
interface TooltipPayloadItem {
  payload: EcosystemYearData;
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
    for (let i = 0; i < 60; i++) {
      const name = yearData[`rank${i}_name`] as string;
      const val = yearData[`rank${i}_count`] as number;
      if (name && name !== 'Unknown' && val > 0) {
        items.push({
          label: name,
          value: val,
          dotClassName: ecosystemDotClass(name, i),
        });
      }
    }
    // 툴팁도 데이터가 큰 순서대로 정렬
    items.sort((a, b) => b.value - a.value);

    return (
      <ChartTooltip title={label} items={items} />
    );
  }
  return null;
};

const EcosystemBarChart = ({ data, isLoading, isError }: EcosystemBarChartProps) => {
  const dataReady = !isLoading && !isError && !!data?.length;
  const { containerRef, dimensions, isReady } = useContainerDimensions({
    dataReady,
    readyDelayMs: 200,
  });

  const chartData = useMemo<EcosystemChartData>(() => {
    if (!data) return { series: [], maxRanks: 0 };

    const yearMap: Record<number, Record<string, number>> = {};
    data.forEach(item => {
      if (!yearMap[item.year]) yearMap[item.year] = {};
      yearMap[item.year][item.ecosystem] = item.count;
    });

    const sortedYears = Object.keys(yearMap).map(Number).sort((a, b) => a - b).slice(-15);
    
    let globalMaxRanks = 0;
    sortedYears.forEach(year => {
        globalMaxRanks = Math.max(globalMaxRanks, Object.keys(yearMap[year]).length);
    });

    const series = sortedYears.map(year => {
      const yearData = yearMap[year];
      // 작은 것 -> 큰 것 순 정렬 (큰 것이 마지막에 그려져서 위에 쌓임)
      const sorted = Object.keys(yearData).sort((a, b) => yearData[a] - yearData[b]);
      
      while (sorted.length < globalMaxRanks) {
        sorted.unshift('Unknown');
      }

      const result: EcosystemYearData = { year };
      sorted.forEach((eco, i) => {
        result[`rank${i}_count`] = eco === 'Unknown' ? 0 : yearData[eco];
        result[`rank${i}_name`] = eco;
      });
      return result;
    });

    return { series, maxRanks: globalMaxRanks };
  }, [data]);

  return (
    <div className="lg:col-span-2 bg-neutral-900/40 cc-panel-border p-8 rounded-[32px] min-h-[600px] flex flex-col relative overflow-visible min-w-0 min-h-0">
      <DashboardPanelHeader
        title="Annual Ecosystem Trend"
        accentClassName="bg-emerald-500"
        tooltip="Annual volume of package vulnerabilities across software ecosystems (npm, PyPI, Maven, Go, etc.). Calculated from OSV database records."
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
                  {Array.from({ length: chartData.maxRanks }).map((_, rank) => (
                    <Bar key={rank} dataKey={`rank${rank}_count`} stackId="a" isAnimationActive={false} radius={rank === chartData.maxRanks - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                      {chartData.series.map((entry, i) => (
                        <Cell key={i} fill={ECOSYSTEM_COLORS[entry[`rank${rank}_name`] as string] || `hsl(${rank * 137.5 % 360}, 50%, 50%)`} />
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

export default EcosystemBarChart;
