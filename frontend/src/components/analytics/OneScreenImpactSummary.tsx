import { Brain, FileText, ShieldAlert, Zap } from 'lucide-react'

export interface OneScreenImpactSummaryProps {
  healthScore?: number
  healthLabel?: string
  cell1Voltage?: number
  cell2Voltage?: number
  cell3Voltage?: number
  imbalanceV?: number
  anomalyScore?: number
  sohPct?: number
  aiAssessment?: string
  onOpenReport?: () => void
}

export function OneScreenImpactSummary({
  healthScore = 46,
  healthLabel = 'POOR',
  cell1Voltage = 3.60,
  cell2Voltage = 3.60,
  cell3Voltage = 1.10,
  imbalanceV = 2.50,
  anomalyScore = 94,
  sohPct = 76,
  aiAssessment = 'Cell 3 shows severe voltage deviation (1.10 V) and requires immediate inspection and isolation.',
  onOpenReport,
}: OneScreenImpactSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-critical/40 bg-slate-950 p-6 shadow-2xl text-slate-100 font-sans">
      {/* Background Subtle Gradient Grid */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      
      {/* Card Header */}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-critical/40 bg-critical/20 text-critical shadow-sm">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-critical">Impact-First Terminal</span>
              <span className="rounded-full bg-critical/20 px-2 py-0.5 text-[9px] font-black text-critical">1-SCREEN DIAGNOSTIC</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
              🔋 THE BLACK BOX — AI BMS COCKPIT
            </h2>
          </div>
        </div>

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/20 px-4 py-2 text-xs font-black text-accent-soft hover:bg-accent/30 transition-all shadow-md active:scale-95"
          >
            <FileText className="h-4 w-4 text-accent" />
            <span>Generate Safety Report</span>
          </button>
        )}
      </div>

      {/* Grid Content */}
      <div className="relative z-10 mt-5 grid gap-6 lg:grid-cols-12 lg:items-center">
        {/* Primary Health Score Tile */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-critical/30 bg-critical/10 p-5 text-center lg:col-span-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BATTERY HEALTH</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-black tracking-tight tabular-nums text-white">{healthScore}</span>
            <span className="text-sm font-bold text-slate-400">/ 100</span>
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-critical/40 bg-critical/20 px-3.5 py-1 text-xs font-black text-critical">
            🔴 {healthLabel}
          </span>
        </div>

        {/* 3-Cell Individual Voltages Grid */}
        <div className="grid grid-cols-3 gap-3 lg:col-span-5">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center">
            <span className="block text-[10px] font-black uppercase text-emerald-400">CELL 1</span>
            <span className="mt-1 block text-lg font-black tabular-nums text-white">{cell1Voltage.toFixed(2)} V</span>
            <span className="mt-1 inline-block text-[9px] font-bold text-emerald-400 uppercase">🟢 HEALTHY</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-center">
            <span className="block text-[10px] font-black uppercase text-emerald-400">CELL 2</span>
            <span className="mt-1 block text-lg font-black tabular-nums text-white">{cell2Voltage.toFixed(2)} V</span>
            <span className="mt-1 inline-block text-[9px] font-bold text-emerald-400 uppercase">🟢 HEALTHY</span>
          </div>

          <div className="rounded-2xl border border-critical/50 bg-critical/20 p-3.5 text-center ring-2 ring-critical/40 animate-pulse">
            <span className="block text-[10px] font-black uppercase text-critical">CELL 3</span>
            <span className="mt-1 block text-lg font-black tabular-nums text-white">{cell3Voltage.toFixed(2)} V</span>
            <span className="mt-1 inline-block text-[9px] font-black text-critical uppercase">🔴 CRITICAL ⚠️</span>
          </div>
        </div>

        {/* Key Operational Indicators */}
        <div className="space-y-2 lg:col-span-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs">
            <span className="text-slate-400 font-medium">Cell Imbalance</span>
            <span className="font-black tabular-nums text-critical">{imbalanceV.toFixed(2)} V</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs">
            <span className="text-slate-400 font-medium">Anomaly Score</span>
            <span className="font-black tabular-nums text-critical">{anomalyScore} / 100</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs">
            <span className="text-slate-400 font-medium">State of Health (SOH)</span>
            <span className="font-black tabular-nums text-amber-400">{sohPct}%</span>
          </div>
        </div>
      </div>

      {/* AI Assessment & Safety Directive Action Strip */}
      <div className="relative z-10 mt-5 flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-black tracking-wide text-amber-400 uppercase">⚠️ AI Assessment</span>
            <p className="mt-0.5 font-medium text-slate-300 leading-relaxed">
              {aiAssessment}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-critical/50 bg-critical/20 px-3.5 py-2 text-xs font-black text-critical">
          <ShieldAlert className="h-4 w-4" />
          <span>ACTION: VERIFY → ISOLATE → INSPECT</span>
        </div>
      </div>
    </div>
  )
}
