import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, FileText, CheckCircle2 } from 'lucide-react'

export interface BatteryReportModalProps {
  open: boolean
  onClose: () => void
  batteryName?: string
  healthScore?: number
  sohPct?: number
  overallRisk?: string
  cell1V?: number
  cell2V?: number
  cell3V?: number
}

export function BatteryReportModal({
  open,
  onClose,
  batteryName = 'Battery Pack 01',
  healthScore = 46,
  sohPct = 76,
  overallRisk = 'CRITICAL',
  cell1V = 3.60,
  cell2V = 3.60,
  cell3V = 1.10,
}: BatteryReportModalProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <FileText className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">
              📄 OFFICIAL AI BATTERY HEALTH & SAFETY REPORT
            </h2>
            <p className="text-xs text-muted">
              Auto-generated diagnostic report for {batteryName} · THE BLACK BOX AI Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button size="sm" onClick={handlePrint} className="gap-1.5 font-bold">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-6 text-xs text-foreground font-sans">
          {/* Executive Summary Grid */}
          <div className="rounded-2xl border border-critical/30 bg-critical/10 p-4">
            <h3 className="text-sm font-black uppercase text-critical tracking-wide mb-3">1. Executive Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="block text-[10px] font-bold text-faint uppercase">Battery Health Score</span>
                <span className="text-xl font-black text-critical tabular-nums">{healthScore} / 100 — POOR</span>
              </div>
              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="block text-[10px] font-bold text-faint uppercase">State of Health (SOH)</span>
                <span className="text-xl font-black text-amber-400 tabular-nums">{sohPct}%</span>
              </div>
              <div className="rounded-xl border border-critical/40 bg-critical/20 p-3">
                <span className="block text-[10px] font-bold text-critical uppercase">Overall Risk Level</span>
                <span className="text-xl font-black text-critical">{overallRisk}</span>
              </div>
            </div>
          </div>

          {/* Cell Analysis Table */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-2">2. Cell Analysis Matrix</h3>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-background-2 text-faint text-[10px] font-extrabold uppercase">
                    <th className="p-3">Cell Identifier</th>
                    <th className="p-3 text-right">Terminal Voltage</th>
                    <th className="p-3 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium">
                  <tr>
                    <td className="p-3 font-bold">Cell 1</td>
                    <td className="p-3 text-right tabular-nums font-extrabold">{cell1V.toFixed(2)} V</td>
                    <td className="p-3 text-right font-bold text-healthy">🟢 Healthy</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">Cell 2</td>
                    <td className="p-3 text-right tabular-nums font-extrabold">{cell2V.toFixed(2)} V</td>
                    <td className="p-3 text-right font-bold text-healthy">🟢 Healthy</td>
                  </tr>
                  <tr className="bg-critical/10 text-critical font-bold">
                    <td className="p-3 font-black">Cell 3 (Fault Located)</td>
                    <td className="p-3 text-right tabular-nums font-black">{cell3V.toFixed(2)} V</td>
                    <td className="p-3 text-right font-black text-critical">🔴 Critical ⚠️</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sections: Issue, Degradation, Reasoning, Risk, Action, Prediction */}
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-background-2/60 p-3.5">
              <h4 className="font-extrabold text-foreground uppercase tracking-wide text-[11px]">3. Detected Issue</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Cell 3 is operating significantly below the remaining cells (1.10 V vs 3.60 V), producing a severe <strong className="text-critical">2.50 V pack imbalance</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-background-2/60 p-3.5">
              <h4 className="font-extrabold text-foreground uppercase tracking-wide text-[11px]">4. Degradation Trend</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Cell 3 voltage has suffered a severe downward trajectory over recent operational cycles (~69% voltage reduction).
              </p>
            </div>

            <div className="rounded-xl border border-line bg-background-2/60 p-3.5">
              <h4 className="font-extrabold text-foreground uppercase tracking-wide text-[11px]">5. Structured AI Reasoning</h4>
              <p className="mt-1 text-muted leading-relaxed">
                The detected voltage deviation is consistent with abnormal cell behavior. Possible causes include severe degradation, abnormal self-discharge, increased internal resistance (ESR), measurement sensor error, or physical cell damage.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-background-2/60 p-3.5">
              <h4 className="font-extrabold text-foreground uppercase tracking-wide text-[11px]">6. Safety Risk Assessment</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Continued operation under this severe imbalance condition increases the risk of thermal/electrical battery instability and further cell capacity collapse.
              </p>
            </div>

            <div className="rounded-xl border border-critical/40 bg-critical/10 p-4">
              <h4 className="font-black text-critical uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> 7. Recommended Action
              </h4>
              <p className="mt-1 text-foreground font-bold leading-relaxed">
                Verify the sensor reading and inspect Cell 3 immediately. If confirmed, isolate the affected cell and consider replacement according to applicable battery manufacturer safety procedures.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-background-2/60 p-3.5">
              <h4 className="font-extrabold text-foreground uppercase tracking-wide text-[11px]">8. Predictive Forecast</h4>
              <p className="mt-1 text-muted leading-relaxed">
                Based on the observed degradation trend, continued deterioration is expected. Future risk estimates should be updated as additional measurements become available.
              </p>
            </div>
          </div>

          <div className="border-t border-line pt-3 flex items-center justify-between text-[10px] text-faint font-medium">
            <span>Report ID: RPT-CELLGUARD-{Date.now().toString().slice(-6)}</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>
    </Dialog>
  )
}
