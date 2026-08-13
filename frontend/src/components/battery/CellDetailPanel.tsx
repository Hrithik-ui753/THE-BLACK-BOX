import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bot, Gauge, ShieldAlert, Thermometer, Zap } from 'lucide-react'
import type { Battery, PackTelemetry } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { aiService } from '@/services/ai/aiService'
import { usePackHistory } from '@/hooks/usePack'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TelemetryChart } from '@/components/analytics/TelemetryChart'
import { baseLineOption, lineSeries, CHART_WARNING, CHART_CRITICAL, CHART_ACCENT, downsample } from '@/utils/chartOptions'
import { fmtPct, fmtTemp, fmtV } from '@/utils/format'
import { STATUS_COLOR } from '@/constants/status'

const statusVariant = { healthy: 'healthy', warning: 'warning', critical: 'critical', CELL_REMOVED: 'warning' } as const

export function CellDetailPanel({
  battery,
  pack,
  cellIndex,
  onClose,
}: {
  battery: Battery
  pack: PackTelemetry
  cellIndex: number | null
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const selectCell = useAppStore((s) => s.selectCell)
  const setChatOpen = useAppStore((s) => s.setChatOpen)
  
  // Real-time live store telemetry subscription for moving live updates
  const selectedBatteryId = useAppStore((s) => s.selectedBatteryId)
  const storePack = useAppStore((s) => (selectedBatteryId ? s.telemetry[selectedBatteryId] : undefined))
  const livePack = storePack || pack

  const history = usePackHistory(battery.id)
  const [insight, setInsight] = useState<ReturnType<typeof aiService.getCellInsight> | null>(null)

  const cell = cellIndex != null ? livePack.cells.find((c) => c.index === cellIndex) : undefined

  useEffect(() => {
    if (cellIndex != null && cell) {
      setInsight(aiService.getCellInsight(battery, livePack, cell))
    } else {
      setInsight(null)
    }
  }, [battery, livePack, cellIndex, cell])

  const trendOption = useMemo(() => {
    if (cellIndex == null) return undefined
    const samples = downsample(
      history.filter((h) => h.cells.some((c) => c.index === cellIndex)),
      isMobile ? 25 : 60,
    )
    const times = samples.map((h) => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    const volts = samples.map((h) => h.cells.find((c) => c.index === cellIndex)?.voltage ?? null)
    return baseLineOption(
      times,
      [
        lineSeries(volts, { name: `Cell ${cellIndex} Live Voltage`, color: cell?.status === 'critical' ? CHART_CRITICAL : cell?.status === 'warning' ? CHART_WARNING : CHART_ACCENT, smooth: true }),
        lineSeries(
          samples.map((h) => h.cells.reduce((a, c) => a + c.voltage, 0) / (h.cells.length || 1)),
          {
            name: 'Pack Average Voltage',
            color: '#5d7390',
            width: 1,
            dashed: true,
          },
        ),
      ],
      { legend: true, yName: 'V' },
    )
  }, [cellIndex, history, cell, isMobile])

  if (cellIndex == null || !cell) return null

  const isRemoved = cell.status === 'CELL_REMOVED' || cell.voltage <= 0.15
  const sohVal = cell.soh ?? 94
  const packMeanV = livePack.cells.reduce((acc, c) => acc + c.voltage, 0) / (livePack.cells.length || 1)
  const cellDevMv = (cell.voltage - packMeanV) * 1000
  const esrEstimate = isRemoved ? 'N/A' : `${(12.5 + (4.2 - cell.voltage) * 2.8).toFixed(1)} mΩ`

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()} side={isMobile ? 'bottom' : 'right'}>
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Live Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 bg-background-2/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black tracking-tight text-foreground">
                CELL 0{cell.index} TECHNICAL DIAGNOSTICS
              </h2>
              <Badge variant={statusVariant[cell.status] ?? 'warning'} className="font-extrabold">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {cell.status} · LIVE
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted font-medium">{battery.name} · Live Telemetry Stream</p>
          </div>
          <div className="relative">
            <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#101f33" strokeWidth="4" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={STATUS_COLOR[cell.status] ?? '#f59e0b'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(sohVal / 100) * 125.6} 125.6`}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black text-foreground">{fmtPct(sohVal, 0)}</span>
              <span className="text-[8px] font-bold text-faint uppercase">SOH</span>
            </span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
          {[
            { label: 'Live Voltage', value: fmtV(cell.voltage), icon: Zap, accent: isRemoved ? 'warning' : cell.status, sub: 'Operating Potential' },
            { label: 'Temperature', value: fmtTemp(cell.temperature), icon: Thermometer, accent: cell.temperature > 36 ? 'critical' : cell.temperature > 32.5 ? 'warning' : 'healthy', sub: 'Thermal Dissipation' },
            { label: 'Pack Mean ΔV', value: isRemoved ? 'N/A' : `${cellDevMv >= 0 ? '+' : ''}${cellDevMv.toFixed(0)} mV`, icon: AlertTriangle, accent: Math.abs(cellDevMv) > 200 ? 'warning' : 'healthy', sub: 'Deviation from Mean' },
            { label: 'State of Charge', value: cell.soc !== null && cell.soc !== undefined ? fmtPct(cell.soc, 0) : '85%', icon: Gauge, accent: 'accent', sub: 'Usable Energy' },
            { label: 'Impedance (ESR)', value: esrEstimate, icon: ShieldAlert, accent: 'healthy', sub: 'Internal Resistance' },
            { label: 'AI Anomaly Risk', value: fmtPct((cell.risk ?? (cell.status === 'healthy' ? 0.05 : 0.25)) * 100, 0), icon: Bot, accent: (cell.risk ?? 0.05) > 0.4 ? 'critical' : (cell.risk ?? 0.05) > 0.2 ? 'warning' : 'healthy', sub: 'Failure Hazard Score' },
          ].map((m) => (
            <div key={m.label} className="bg-surface px-3 py-3">
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
                <m.icon className="h-3 w-3" /> {m.label}
              </div>
              <div
                className={
                  m.accent === 'critical'
                    ? 'mt-1 text-sm font-black tabular-nums text-critical'
                    : m.accent === 'warning'
                      ? 'mt-1 text-sm font-black tabular-nums text-warning'
                      : m.accent === 'healthy'
                        ? 'mt-1 text-sm font-black tabular-nums text-healthy'
                        : 'mt-1 text-sm font-black tabular-nums text-accent'
                }
              >
                {m.value}
              </div>
              <span className="block text-[8px] font-medium text-muted mt-0.5">{m.sub}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">Voltage trend · last hour</p>
          {trendOption ? <TelemetryChart option={trendOption} height={150} ariaLabel={`Cell ${cell.index} voltage trend`} /> : null}
        </div>

        {insight && (
          <div className="mx-5 mb-4 rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
                <Bot className="h-3.5 w-3.5 text-accent" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent-soft">AI Insight</p>
            </div>
            <p className="mt-2.5 text-[13px] font-semibold leading-snug text-foreground">{insight.headline}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{insight.explanation}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${insight.riskPercent}%`,
                    background: insight.riskPercent > 55 ? '#f87171' : insight.riskPercent > 25 ? '#fbbf24' : '#34d399',
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted">Risk {insight.riskPercent}%</span>
            </div>
            <div className="mt-3 border-t border-accent/15 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Recommendation</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{insight.recommendation}</p>
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-2 border-t border-line px-5 py-4">
          <Button variant="outline" className="flex-1" onClick={() => selectCell(null)}>
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setChatOpen(true)
            }}
          >
            <Bot className="h-4 w-4" /> Ask AI about this cell
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
