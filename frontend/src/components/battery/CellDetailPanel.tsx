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
import { fmtMv, fmtPct, fmtTemp, fmtV } from '@/utils/format'
import { STATUS_COLOR } from '@/constants/status'

const statusVariant = { healthy: 'healthy', warning: 'warning', critical: 'critical' } as const

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
  const history = usePackHistory(battery.id)
  const [insight, setInsight] = useState<ReturnType<typeof aiService.getCellInsight> | null>(null)

  const cell = cellIndex != null ? pack.cells.find((c) => c.index === cellIndex) : undefined

  useEffect(() => {
    if (cellIndex != null && cell) {
      setInsight(aiService.getCellInsight(battery, pack, cell))
    } else {
      setInsight(null)
    }
  }, [cellIndex, battery, pack, cell])

  const trendOption = useMemo(() => {
    if (cellIndex == null) return undefined
    const samples = downsample(
      history.filter((h) => h.cells.some((c) => c.index === cellIndex)),
      60,
    )
    const times = samples.map((h) => new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    const volts = samples.map((h) => h.cells.find((c) => c.index === cellIndex)?.voltage ?? null)
    return baseLineOption(
      times,
      [
        lineSeries(volts, { name: `Cell ${cellIndex} voltage`, color: cell?.status === 'critical' ? CHART_CRITICAL : cell?.status === 'warning' ? CHART_WARNING : CHART_ACCENT, smooth: true }),
        lineSeries(
          samples.map((h) => h.cells.reduce((a, c) => a + c.voltage, 0) / h.cells.length),
          {
            name: 'Pack average',
            color: '#5d7390',
            width: 1,
            dashed: true,
          },
        ),
      ],
      { legend: false, yName: 'V' },
    )
  }, [cellIndex, history, cell, pack])

  return (
    <Sheet open={cellIndex != null} onOpenChange={(o) => !o && onClose()} side={isMobile ? 'bottom' : 'right'}>
      {cell && cellIndex != null && (
        <div className="flex h-full max-h-[88dvh] flex-col overflow-y-auto">
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-foreground">
                  CELL {String(cell.index).padStart(2, '0')}
                </h2>
                <Badge variant={statusVariant[cell.status]}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {cell.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{battery.name} · {battery.type}</p>
            </div>
            <div className="relative">
              <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#101f33" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={STATUS_COLOR[cell.status]}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(cell.soh / 100) * 125.6} 125.6`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                {fmtPct(cell.soh, 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px border-b border-line bg-line">
            {[
              { label: 'Voltage', value: fmtV(cell.voltage), icon: Zap, accent: cell.status },
              { label: 'Temperature', value: fmtTemp(cell.temperature), icon: Thermometer, accent: cell.temperature > 36 ? 'critical' : cell.temperature > 32.5 ? 'warning' : 'healthy' },
              { label: 'SOC', value: fmtPct(cell.soc, 0), icon: Gauge, accent: 'accent' },
              { label: 'SOH', value: fmtPct(cell.soh, 0), icon: ShieldAlert, accent: cell.soh > 90 ? 'healthy' : cell.soh > 80 ? 'warning' : 'critical' },
              { label: 'Deviation', value: fmtMv(cell.deviation), icon: AlertTriangle, accent: cell.status },
              { label: 'AI Risk', value: fmtPct(cell.risk * 100, 0), icon: Bot, accent: cell.status },
            ].map((m) => (
              <div key={m.label} className="bg-surface px-3 py-3">
                <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-faint">
                  <m.icon className="h-3 w-3" /> {m.label}
                </div>
                <div
                  className={
                    m.accent === 'critical'
                      ? 'mt-1 text-sm font-bold tabular-nums text-critical'
                      : m.accent === 'warning'
                        ? 'mt-1 text-sm font-bold tabular-nums text-warning'
                        : m.accent === 'healthy'
                          ? 'mt-1 text-sm font-bold tabular-nums text-healthy'
                          : 'mt-1 text-sm font-bold tabular-nums text-accent-soft'
                  }
                >
                  {m.value}
                </div>
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
      )}
    </Sheet>
  )
}
