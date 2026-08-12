import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

/**
 * Minimal ECharts wrapper. Charts are created once and updated via setOption,
 * keeping analytics re-renders cheap. The echarts bundle is code-split via
 * the manualChunks config so it never blocks first paint of the app.
 */
export function TelemetryChart({
  option,
  height = 280,
  className,
  ariaLabel,
}: {
  option: EChartsOption
  height?: number
  className?: string
  ariaLabel?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const first = useRef(true)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = echarts.init(el, undefined, { renderer: 'canvas' })
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    chart.setOption(option, { notMerge: first.current })
    first.current = false
  }, [option])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? 'Telemetry chart'}
    />
  )
}
