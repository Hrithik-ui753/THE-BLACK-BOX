import { ShieldAlert, AlertTriangle, OctagonAlert } from 'lucide-react'

export interface CriticalSafetyAlertBannerProps {
  cell3Voltage?: number
  devCell1?: number
  devCell2?: number
  imbalanceV?: number
}

export function CriticalSafetyAlertBanner({
  cell3Voltage = 1.10,
  devCell1 = -2.50,
  devCell2 = -2.50,
  imbalanceV = 2.50,
}: CriticalSafetyAlertBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-critical bg-critical/15 p-6 shadow-2xl backdrop-blur-md animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-critical bg-critical/30 text-critical shadow-lg">
            <OctagonAlert className="h-7 w-7" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-critical">Safety Override</span>
              <span className="rounded-full bg-critical/30 px-2 py-0.5 text-[9px] font-black text-critical">IMMEDIATE ACTION</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              🚨 CRITICAL BATTERY CONDITION DETECTED
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-critical bg-critical px-4 py-2 text-xs font-black text-white shadow-lg">
          <ShieldAlert className="h-4 w-4" />
          <span>STOP NORMAL OPERATION</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-critical/30 bg-background-2/80 p-3 text-center">
          <span className="block text-[10px] font-black uppercase text-faint">Cell 3 Voltage</span>
          <span className="text-lg font-black tabular-nums text-critical">{cell3Voltage.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-critical/30 bg-background-2/80 p-3 text-center">
          <span className="block text-[10px] font-black uppercase text-faint">Diff from Cell 1</span>
          <span className="text-lg font-black tabular-nums text-critical">{devCell1.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-critical/30 bg-background-2/80 p-3 text-center">
          <span className="block text-[10px] font-black uppercase text-faint">Diff from Cell 2</span>
          <span className="text-lg font-black tabular-nums text-critical">{devCell2.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-critical/30 bg-background-2/80 p-3 text-center">
          <span className="block text-[10px] font-black uppercase text-faint">Pack Cell Imbalance</span>
          <span className="text-lg font-black tabular-nums text-critical">{imbalanceV.toFixed(2)} V</span>
        </div>
      </div>

      {/* Action Recommendation */}
      <div className="mt-4 rounded-2xl border border-critical/40 bg-surface/90 p-4 text-xs font-extrabold text-foreground">
        <div className="flex items-center gap-2 text-critical">
          <AlertTriangle className="h-4 w-4" />
          <span className="uppercase tracking-wider">Recommended Safety Protocol:</span>
        </div>
        <p className="mt-1.5 leading-relaxed text-muted">
          <strong className="text-critical">STOP NORMAL OPERATION → INSPECT AFFECTED CELL.</strong> If the reading is verified and the battery system design permits, consider isolating or replacing Cell 3 according to manufacturer safety procedures.
        </p>
      </div>
    </div>
  )
}
