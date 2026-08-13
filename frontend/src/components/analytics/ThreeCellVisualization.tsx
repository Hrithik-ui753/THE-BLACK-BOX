import { AlertTriangle, Battery, BatteryWarning, CheckCircle2, ShieldAlert, PlugZap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/useAppStore'
import type { PackTelemetry } from '@/types'

export interface ThreeCellVisualizationProps {
  cell1V?: number
  cell2V?: number
  cell3V?: number
  pack?: PackTelemetry
}

export function ThreeCellVisualization({
  cell1V = 3.80,
  cell2V = 3.56,
  cell3V = 3.39,
  pack,
}: ThreeCellVisualizationProps) {
  const selectCell = useAppStore((s) => s.selectCell)
  const c1 = pack?.cells?.[0]?.voltage ?? cell1V
  const c2 = pack?.cells?.[1]?.voltage ?? cell2V
  const c3 = pack?.cells?.[2]?.voltage ?? cell3V

  const presentVoltages = [c1, c2, c3].filter((v) => v > 0.15)
  const presentCount = presentVoltages.length

  const maxV = presentCount > 0 ? Math.max(...presentVoltages) : 0
  const minV = presentCount > 0 ? Math.min(...presentVoltages) : 0
  const diffV = presentCount >= 2 ? maxV - minV : 0

  const getCellStatus = (v: number, index: number) => {
    const isRemoved = v <= 0.15 || pack?.cells?.[index]?.status === 'CELL_REMOVED'
    if (isRemoved) {
      return {
        status: 'CELL_REMOVED',
        label: 'CELL REMOVED 🔌',
        border: 'border-2 border-amber-500/50 bg-amber-500/10 shadow-lg ring-1 ring-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        socStr: '--',
        sohStr: '--',
        isRemoved: true,
      }
    }
    if (v <= 2.50) {
      return {
        status: 'CRITICAL',
        label: 'CRITICAL ⚠️',
        border: 'border-2 border-critical bg-critical/10 shadow-lg ring-2 ring-critical/30 animate-pulse',
        text: 'text-critical',
        badge: 'bg-critical/20 text-critical',
        socStr: pack?.cells?.[index]?.soc !== null && pack?.cells?.[index]?.soc !== undefined ? `${pack.cells[index].soc}%` : '78%',
        sohStr: pack?.cells?.[index]?.soh !== null && pack?.cells?.[index]?.soh !== undefined ? `${pack.cells[index].soh}%` : '94%',
        isRemoved: false,
      }
    }
    if (v < 3.20 || (maxV - v) > 0.45) {
      return {
        status: 'WARNING',
        label: 'ELEVATED IMBALANCE',
        border: 'border-2 border-warning bg-warning/10',
        text: 'text-warning',
        badge: 'bg-warning/20 text-warning',
        socStr: pack?.cells?.[index]?.soc !== null && pack?.cells?.[index]?.soc !== undefined ? `${pack.cells[index].soc}%` : '80%',
        sohStr: pack?.cells?.[index]?.soh !== null && pack?.cells?.[index]?.soh !== undefined ? `${pack.cells[index].soh}%` : '94%',
        isRemoved: false,
      }
    }
    return {
      status: 'HEALTHY',
      label: 'PRESENT · HEALTHY',
      border: 'border border-healthy/40 bg-background-2/80',
      text: 'text-healthy',
      badge: 'bg-healthy/10 text-healthy',
      socStr: pack?.cells?.[index]?.soc !== null && pack?.cells?.[index]?.soc !== undefined ? `${pack.cells[index].soc}%` : '85%',
      sohStr: pack?.cells?.[index]?.soh !== null && pack?.cells?.[index]?.soh !== undefined ? `${pack.cells[index].soh}%` : '95%',
      isRemoved: false,
    }
  }

  const cells = [
    { id: 1, name: 'CELL 01', v: c1, info: getCellStatus(c1, 0) },
    { id: 2, name: 'CELL 02', v: c2, info: getCellStatus(c2, 1) },
    { id: 3, name: 'CELL 03', v: c3, info: getCellStatus(c3, 2) },
  ]

  const weakest = presentCount > 0
    ? cells.filter((c) => !c.info.isRemoved).reduce((prev, curr) => (curr.v < prev.v ? curr : prev), cells[0])
    : cells[0]

  const overallStatus = presentCount < 3 ? 'CELL MISSING' : (minV <= 2.50 || diffV > 0.60 ? 'CRITICAL' : diffV > 0.35 || minV < 3.20 ? 'WARNING' : 'HEALTHY')

  const overallBadgeStyle =
    overallStatus === 'CELL MISSING'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
      : overallStatus === 'CRITICAL'
      ? 'border-critical/40 bg-critical/10 text-critical'
      : overallStatus === 'WARNING'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-healthy/40 bg-healthy/10 text-healthy'

  const headerLabel =
    overallStatus === 'CELL MISSING'
      ? `🔌 PACK STATUS: CELL MISSING (${presentCount}/3 PRESENT)`
      : overallStatus === 'CRITICAL'
      ? `FAULT LOCATED: CELL ${weakest.id}`
      : overallStatus === 'WARNING'
      ? `ELEVATED IMBALANCE: ΔV = ${diffV.toFixed(2)} V`
      : 'ALL 3 CELLS PRESENT & BALANCED'

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${overallBadgeStyle}`}>
              {overallStatus === 'CELL MISSING' ? (
                <PlugZap className="h-4.5 w-4.5 text-amber-400" />
              ) : (
                <BatteryWarning className={`h-4.5 w-4.5 ${overallStatus === 'CRITICAL' ? 'text-critical' : overallStatus === 'WARNING' ? 'text-warning' : 'text-healthy'}`} />
              )}
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">
                1. 🔋 3-CELL BATTERY VISUALIZATION
              </CardTitle>
              <p className="text-xs text-muted">Cell-level hardware presence & ML safety status · Click any cell for live drawer</p>
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${overallBadgeStyle}`}>
            {headerLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* 3-Cell Physical Layout Representation */}
        <div className="grid gap-4 md:grid-cols-3">
          {cells.map((cell) => (
            <div
              key={cell.id}
              onClick={() => selectCell(cell.id)}
              className={`relative overflow-hidden rounded-3xl p-5 transition-all shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-md ${cell.info.border}`}
            >
              <div className={`flex items-center justify-between text-xs font-extrabold ${cell.info.text}`}>
                <span>{cell.name}</span>
                {cell.info.isRemoved ? (
                  <PlugZap className="h-4 w-4 text-amber-400" />
                ) : cell.info.status === 'CRITICAL' ? (
                  <AlertTriangle className="h-4 w-4 text-critical" />
                ) : (
                  <Battery className="h-4 w-4" />
                )}
              </div>

              <div className="my-3 text-center">
                <span className="text-3xl font-black tabular-nums text-foreground">{cell.v.toFixed(2)} V</span>
                <p className="mt-0.5 text-[10px] font-bold text-muted uppercase">
                  {cell.info.isRemoved ? 'ADC Offset (Removed Cell)' : 'Valid Battery Voltage'}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-line/40 bg-background-2/60 p-2 text-center text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-faint uppercase">SOC</span>
                  <span className={`font-black tabular-nums ${cell.info.isRemoved ? 'text-muted' : 'text-accent'}`}>{cell.info.socStr}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-faint uppercase">SOH</span>
                  <span className={`font-black tabular-nums ${cell.info.isRemoved ? 'text-muted' : 'text-healthy'}`}>{cell.info.sohStr}</span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${cell.info.badge}`}>
                  {cell.info.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Summary Card */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Present Cells</span>
            <span className="mt-1 block text-lg font-black text-foreground">{presentCount} / 3 Cells</span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Min Present Voltage</span>
            <span className={`mt-1 block text-lg font-black tabular-nums ${presentCount > 0 ? weakest.info.text : 'text-muted'}`}>
              {presentCount > 0 ? `${minV.toFixed(2)} V` : '--'}
            </span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Voltage Spread (ΔV)</span>
            <span className={`mt-1 block text-lg font-black tabular-nums ${diffV > 0.35 ? 'text-warning' : 'text-healthy'}`}>
              {presentCount >= 2 ? `${diffV.toFixed(2)} V` : 'N/A'}
            </span>
          </div>

          <div className={`rounded-2xl border p-3.5 ${overallBadgeStyle}`}>
            <span className="block text-[10px] font-bold uppercase">Pack Status</span>
            <span className="mt-1 block text-lg font-black uppercase">{overallStatus}</span>
          </div>
        </div>

        {/* Dynamic Safety Action Recommendation */}
        <div className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold ${overallBadgeStyle}`}>
          {overallStatus === 'HEALTHY' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-healthy" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
          <div>
            <span className="block font-black uppercase tracking-wide">Recommended Operating Action:</span>
            <p className="mt-0.5 text-foreground font-semibold">
              {overallStatus === 'CELL MISSING'
                ? `🔌 CELL REMOVED DETECTED (${presentCount}/3 Present) — Open circuit ~0.07V detected. ML inference skipped for missing cell(s). Re-insert cell into holder to resume ML predictions.`
                : overallStatus === 'CRITICAL'
                ? `⚠️ CELL ${weakest.id} REQUIRES INSPECTION / REPLACEMENT — Voltage ${weakest.v.toFixed(2)} V breached safe cutoff threshold.`
                : overallStatus === 'WARNING'
                ? `🟡 ELEVATED IMBALANCE (ΔV = ${diffV.toFixed(2)} V) — Cell ${weakest.id} is operating lower (${weakest.v.toFixed(2)} V). Perform cell balance routine on next charge.`
                : `🟢 ALL 3 CELLS PRESENT & OPERATING OPTIMALLY — Voltages (C1: ${c1.toFixed(2)}V, C2: ${c2.toFixed(2)}V, C3: ${c3.toFixed(2)}V) are within safe bounds.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

