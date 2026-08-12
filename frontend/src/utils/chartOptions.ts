import type { EChartsOption } from 'echarts'

export const CHART_AXIS = '#475569'
export const CHART_GRID = 'rgba(226, 232, 240, 0.8)'
export const CHART_ACCENT = '#ea580c'
export const CHART_HEALTHY = '#10b981'
export const CHART_WARNING = '#f59e0b'
export const CHART_CRITICAL = '#ef4444'

interface SeriesOpts {
  name: string
  color?: string
  area?: boolean
  smooth?: boolean
  width?: number
  dashed?: boolean
}

export function lineSeries(data: Array<number | null>, opts: SeriesOpts) {
  return {
    name: opts.name,
    type: 'line' as const,
    data,
    smooth: opts.smooth ?? true,
    showSymbol: false,
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: {
      width: opts.width ?? 2,
      color: opts.color,
      type: (opts.dashed ? 'dashed' : 'solid') as 'solid' | 'dashed',
    },
    itemStyle: { color: opts.color },
    areaStyle: opts.area
      ? {
          opacity: 0.12,
          color: opts.color,
        }
      : undefined,
    emphasis: { focus: 'series' as const },
  }
}

export function baseLineOption(
  xData: Array<string | number>,
  series: ReturnType<typeof lineSeries>[],
  opts: { yName?: string; min?: number; max?: number; legend?: boolean; tooltipFormatter?: string; markLine?: any } = {},
): EChartsOption {
  return {
    animationDuration: 250,
    color: [CHART_ACCENT, CHART_HEALTHY, CHART_WARNING, CHART_CRITICAL, '#0284c7', '#3b82f6', '#8b5cf6', '#d97706'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      textStyle: { color: '#0f172a', fontSize: 11 },
      axisPointer: { lineStyle: { color: '#cbd5e1' } },
      formatter: opts.tooltipFormatter,
    },
    legend: opts.legend === false ? undefined : {
      top: 0,
      right: 0,
      textStyle: { color: CHART_AXIS, fontSize: 10 },
    },
    grid: { left: 40, right: 16, top: opts.legend === false ? 16 : 28, bottom: 24, containLabel: false },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: CHART_AXIS } },
      axisLabel: { color: CHART_AXIS, fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: opts.yName,
      nameTextStyle: { color: CHART_AXIS, fontSize: 10 },
      min: opts.min,
      max: opts.max,
      splitLine: { lineStyle: { color: CHART_GRID, type: 'dashed' } },
      axisLabel: { color: CHART_AXIS, fontSize: 10 },
    },
    series: series.map((s, idx) =>
      idx === 0 && opts.markLine
        ? { ...s, markLine: opts.markLine }
        : s,
    ),
  }
}

export function downsample<T>(arr: T[] | undefined | null, max: number): T[] {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return []
  if (arr.length <= max) return arr
  const step = arr.length / max
  const out: T[] = []
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)])
  return out
}
