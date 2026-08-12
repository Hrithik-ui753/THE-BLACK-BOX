import { useMemo } from 'react'
import { Activity, AlertTriangle, Brain, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TelemetryChart } from './TelemetryChart'
import { baseLineOption, lineSeries } from '@/utils/chartOptions'
import type { CellTelemetry, PackTelemetry } from '@/types'

export interface CellImbalanceAnalyticsProps {
  pack: PackTelemetry
  historyLabels?: string[]
  cellVoltageHistory?: Array<{ name: string; color: string; data: number[] }>
}

export function CellImbalanceAnalytics({
  pack,
  historyLabels = ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25', '12:30'],
  cellVoltageHistory,
}: CellImbalanceAnalyticsProps) {
  const cells: CellTelemetry[] = pack.cells ?? []

  // Math calculation for Vmax, Vmin, deltaV
  const { maxCell, minCell, deltaV, status, statusBadgeBg } = useMemo(() => {
    if (!cells.length) {
      return { maxCell: null, minCell: null, deltaV: 0, status: 'Healthy', statusBadgeBg: 'bg-healthy/10 text-healthy border-healthy/30' }
    }
    let max = cells[0]
    let min = cells[0]
    cells.forEach((c) => {
      if (c.voltage > max.voltage) max = c
      if (c.voltage < min.voltage) min = c
    })
    const diff = max.voltage - min.voltage
    let s = 'Healthy'
    let badge = 'bg-healthy/10 text-healthy border-healthy/30'

    if (diff > 0.20) {
      s = 'CRITICAL'
      badge = 'bg-critical/10 text-critical border-critical/40'
    } else if (diff > 0.10) {
      s = 'WARNING'
      badge = 'bg-warning/10 text-warning border-warning/40'
    } else if (diff >= 0.05) {
      s = 'WATCH'
      badge = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    }

    return { maxCell: max, minCell: min, deltaV: diff, status: s, statusBadgeBg: badge }
  }, [cells])

  const thresholdScales = [
    { label: '< 0.05 V', name: 'Healthy', style: 'border-healthy/40 text-healthy' },
    { label: '0.05–0.10 V', name: 'Watch', style: 'border-cyan-500/40 text-cyan-400' },
    { label: '0.10–0.20 V', name: 'Warning', style: 'border-warning/40 text-warning' },
    { label: '> 0.20 V', name: 'Critical', style: 'border-critical/40 text-critical' },
  ]

  // Default cell series if none provided
  const chartSeries = useMemo(() => {
    if (cellVoltageHistory && cellVoltageHistory.length > 0) {
      return cellVoltageHistory.map((s) => lineSeries(s.data, { name: s.name, color: s.color }))
    }
    return cells.map((c, i) => {
      const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#ec4899']
      const baseV = c.voltage
      const mockData = historyLabels.map((_, idx) => baseV + Math.sin(idx * 0.5 + i) * 0.02)
      return lineSeries(mockData, { name: `Cell ${String(c.index).padStart(2, '0')}`, color: colors[i % colors.length] })
    })
  }, [cellVoltageHistory, cells, historyLabels])

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Activity className="h-4.5 w-4.5 text-accent" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">2. ⚡ CELL IMBALANCE DETECTION</CardTitle>
              <p className="text-xs text-muted">Individual cell terminal voltage tracking & delta variance</p>
            </div>
          </div>

          {/* Voltage Imbalance Badge */}
          <div className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-1.5 font-extrabold ${statusBadgeBg}`}>
            <AlertTriangle className="h-4 w-4" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">Voltage Imbalance ΔV</span>
              <span className="text-sm font-black tabular-nums">{deltaV.toFixed(2)} V — {status}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Scale Legend Bar */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="text-faint uppercase tracking-wider text-[10px]">Scale Thresholds:</span>
          {thresholdScales.map((t) => (
            <div key={t.name} className={`rounded-lg border px-2.5 py-1 bg-background-2/60 ${t.style}`}>
              <span>{t.label}</span> · <span>{t.name}</span>
            </div>
          ))}
        </div>

        {/* Cell-by-Cell Horizontal Voltage Bars */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cells.map((cell) => {
            const isMin = minCell?.index === cell.index
            const diffFromMax = maxCell ? cell.voltage - maxCell.voltage : 0
            const pct = Math.min(Math.max(((cell.voltage - 2.8) / (4.2 - 2.8)) * 100, 0), 100)
            const cellColor = isMin && deltaV > 0.10 ? 'bg-critical' : cell.status === 'warning' ? 'bg-warning' : 'bg-accent'

            return (
              <div
                key={cell.index}
                className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all ${
                  isMin && deltaV > 0.10
                    ? 'border-critical bg-critical/10 shadow-md ring-1 ring-critical/40'
                    : 'border-line bg-background-2/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-foreground">Cell {cell.index}</span>
                  <span className="tabular-nums text-foreground">{cell.voltage.toFixed(2)} V</span>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full ${cellColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-faint">{cell.status.toUpperCase()}</span>
                  <span className={diffFromMax < -0.10 ? 'text-critical' : 'text-muted'}>
                    {diffFromMax === 0 ? 'Strongest' : `${diffFromMax.toFixed(2)} V`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Weakest Cell Spotlight & Trend Graph Grid */}
        <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
          {/* Spotlight Card */}
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 shadow-sm lg:col-span-4">
            <div className="flex items-center gap-2 text-warning font-bold text-xs">
              <ShieldAlert className="h-4 w-4" />
              <span>Weakest Cell Spotlight</span>
            </div>
            {minCell && (
              <div className="mt-3 space-y-2">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Cell Identifier</span>
                  <span className="text-lg font-black text-foreground">Cell {minCell.index}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Voltage</span>
                    <span className="text-base font-extrabold tabular-nums text-critical">{minCell.voltage.toFixed(2)} V</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Diff from Max</span>
                    <span className="text-base font-extrabold tabular-nums text-critical">
                      {(minCell.voltage - (maxCell?.voltage ?? minCell.voltage)).toFixed(2)} V
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voltage vs Time Trend Chart */}
          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Cell Voltage vs Time (V)</h4>
              <span className="text-[11px] font-semibold text-accent-soft">Live Imbalance Trend</span>
            </div>
            <TelemetryChart
              height={220}
              ariaLabel="Cell Voltage vs Time"
              option={baseLineOption(historyLabels, chartSeries, { yName: 'V', min: 2.8, max: 4.2 })}
            />
          </div>
        </div>

        {/* AI Insight */}
        <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-3.5 text-xs">
          <Brain className="h-4 w-4 shrink-0 text-accent" />
          <p className="font-medium text-muted leading-relaxed">
            <strong className="text-accent font-bold">AI Insight: </strong>
            “Cell {minCell?.index ?? 3} is significantly lower than the other cells (ΔV = {deltaV.toFixed(2)} V). Continued imbalance may indicate localized degradation or increased internal resistance.”
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
