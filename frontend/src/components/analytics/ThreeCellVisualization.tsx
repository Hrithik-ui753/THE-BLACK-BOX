import { AlertTriangle, Battery, BatteryWarning, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ThreeCellVisualizationProps {
  cell1V?: number
  cell2V?: number
  cell3V?: number
}

export function ThreeCellVisualization({
  cell1V = 3.80,
  cell2V = 3.56,
  cell3V = 3.39,
}: ThreeCellVisualizationProps) {
  const maxV = Math.max(cell1V, cell2V, cell3V)
  const minV = Math.min(cell1V, cell2V, cell3V)
  const diffV = maxV - minV

  const getCellStatus = (v: number) => {
    if (v <= 2.50) return { status: 'CRITICAL', label: 'CRITICAL ⚠️', border: 'border-2 border-critical bg-critical/10 shadow-lg ring-2 ring-critical/30 animate-pulse', text: 'text-critical', badge: 'bg-critical/20 text-critical' }
    if (v < 3.20 || (maxV - v) > 0.45) return { status: 'WARNING', label: 'ELEVATED IMBALANCE', border: 'border-2 border-warning bg-warning/10', text: 'text-warning', badge: 'bg-warning/20 text-warning' }
    return { status: 'HEALTHY', label: 'HEALTHY', border: 'border border-healthy/40 bg-background-2/80', text: 'text-healthy', badge: 'bg-healthy/10 text-healthy' }
  }

  const cells = [
    { id: 1, name: 'CELL 01', v: cell1V, info: getCellStatus(cell1V) },
    { id: 2, name: 'CELL 02', v: cell2V, info: getCellStatus(cell2V) },
    { id: 3, name: 'CELL 03', v: cell3V, info: getCellStatus(cell3V) },
  ]

  const weakest = cells.reduce((prev, curr) => (curr.v < prev.v ? curr : prev), cells[0])

  const overallStatus = minV <= 2.50 || diffV > 0.60 ? 'CRITICAL' : diffV > 0.35 || minV < 3.20 ? 'WARNING' : 'HEALTHY'

  const overallBadgeStyle =
    overallStatus === 'CRITICAL'
      ? 'border-critical/40 bg-critical/10 text-critical'
      : overallStatus === 'WARNING'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-healthy/40 bg-healthy/10 text-healthy'

  const headerLabel =
    overallStatus === 'CRITICAL'
      ? `FAULT LOCATED: CELL ${weakest.id}`
      : overallStatus === 'WARNING'
      ? `ELEVATED IMBALANCE: ΔV = ${diffV.toFixed(2)} V`
      : 'ALL CELLS BALANCED'

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${overallStatus === 'CRITICAL' ? 'border-critical/30 bg-critical/10' : overallStatus === 'WARNING' ? 'border-warning/30 bg-warning/10' : 'border-healthy/30 bg-healthy/10'}`}>
              <BatteryWarning className={`h-4.5 w-4.5 ${overallStatus === 'CRITICAL' ? 'text-critical' : overallStatus === 'WARNING' ? 'text-warning' : 'text-healthy'}`} />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">
                1. 🔋 3-CELL BATTERY VISUALIZATION
              </CardTitle>
              <p className="text-xs text-muted">Cell-level hardware topology & fault identification</p>
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
            <div key={cell.id} className={`relative overflow-hidden rounded-3xl p-5 text-center transition-all shadow-sm ${cell.info.border}`}>
              <div className={`flex items-center justify-between text-xs font-extrabold ${cell.info.text}`}>
                <span>{cell.name}</span>
                {cell.info.status === 'CRITICAL' ? (
                  <AlertTriangle className="h-4 w-4 text-critical" />
                ) : (
                  <Battery className="h-4 w-4" />
                )}
              </div>
              <div className="my-4">
                <span className="text-3xl font-black tabular-nums text-foreground">{cell.v.toFixed(2)} V</span>
              </div>
              <span className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-black uppercase ${cell.info.badge}`}>
                {cell.info.label}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Summary Card */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Weakest Cell</span>
            <span className={`mt-1 block text-lg font-black ${weakest.info.text}`}>{weakest.name}</span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Voltage</span>
            <span className={`mt-1 block text-lg font-black tabular-nums ${weakest.info.text}`}>{minV.toFixed(2)} V</span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Voltage Difference (ΔV)</span>
            <span className={`mt-1 block text-lg font-black tabular-nums ${diffV > 0.35 ? 'text-warning' : 'text-healthy'}`}>{diffV.toFixed(2)} V</span>
          </div>

          <div className={`rounded-2xl border p-3.5 ${overallBadgeStyle}`}>
            <span className="block text-[10px] font-bold uppercase">Status</span>
            <span className="mt-1 block text-lg font-black uppercase">{overallStatus}</span>
          </div>
        </div>

        {/* Dynamic Safety Action Recommendation */}
        <div className={`flex items-center gap-3 rounded-2xl border p-4 text-xs font-bold ${overallBadgeStyle}`}>
          {overallStatus === 'HEALTHY' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-healthy" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
          <div>
            <span className="block font-black uppercase tracking-wide">Recommended Operating Action:</span>
            <p className="mt-0.5 text-foreground font-semibold">
              {overallStatus === 'CRITICAL'
                ? `⚠️ CELL ${weakest.id} REQUIRES INSPECTION / REPLACEMENT — Voltage ${weakest.v.toFixed(2)} V breached safe cutoff threshold.`
                : overallStatus === 'WARNING'
                ? `🟡 ELEVATED IMBALANCE (ΔV = ${diffV.toFixed(2)} V) — Cell ${weakest.id} is operating lower (${weakest.v.toFixed(2)} V). Perform cell balance routine on next charge.`
                : `🟢 ALL 3 CELLS BALANCED & OPERATING OPTIMALLY — Voltages (C1: ${cell1V.toFixed(2)}V, C2: ${cell2V.toFixed(2)}V, C3: ${cell3V.toFixed(2)}V) are within safe bounds.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
