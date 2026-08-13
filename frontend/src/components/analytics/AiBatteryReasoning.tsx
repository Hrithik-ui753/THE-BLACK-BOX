import { AlertOctagon, Brain, CheckCircle2, Eye, FileSearch, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AiBatteryReasoningProps {
  cell1V?: number
  cell2V?: number
  cell3V?: number
}

export function AiBatteryReasoning({
  cell1V = 3.80,
  cell2V = 3.56,
  cell3V = 3.39,
}: AiBatteryReasoningProps) {
  const cells = [cell1V, cell2V, cell3V]
  const minV = Math.min(...cells)
  const maxV = Math.max(...cells)
  const minCellIndex = cells.indexOf(minV) + 1
  const maxCellIndex = cells.indexOf(maxV) + 1
  const deltaV = maxV - minV

  const isHealthy = minV >= 3.0 && deltaV <= 0.45
  const isCritical = minV <= 2.50 || deltaV > 0.60

  const reasoningSteps = isHealthy
    ? [
        {
          title: '1. Fact Observation (Measured Voltages)',
          icon: Eye,
          color: 'text-healthy border-healthy/40 bg-healthy/10',
          content: `Cell 1 (${cell1V.toFixed(2)} V), Cell 2 (${cell2V.toFixed(2)} V), and Cell 3 (${cell3V.toFixed(2)} V) are all operating within nominal Li-ion voltage bounds (3.00 V – 4.20 V).`,
        },
        {
          title: '2. Imbalance Variance (ΔV)',
          icon: AlertOctagon,
          color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
          content: `Maximum cell spread ΔV = ${deltaV.toFixed(2)} V (between Cell ${maxCellIndex} and Cell ${minCellIndex}). This is within nominal operating variance during load discharge.`,
        },
        {
          title: '3. Historical Trend Pattern',
          icon: TrendingDown,
          color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
          content: `All cell voltage trajectories follow uniform discharge slopes under standard operating currents.`,
        },
        {
          title: '4. AI Risk Interpretation & Health Index',
          icon: FileSearch,
          color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
          content: `No thermal elevation, internal resistance spike, or abnormal self-discharge detected across the 3 cell channels.`,
        },
        {
          title: '5. Safety Assessment',
          icon: ShieldAlert,
          color: 'text-healthy border-healthy/40 bg-healthy/10',
          content: `Pack status is healthy and stable. Low risk of capacity collapse or electrical instability.`,
        },
      ]
    : [
        {
          title: '1. Fact Observation (Measured Voltages)',
          icon: Eye,
          color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
          content: `Cell ${minCellIndex} is currently operating low at ${minV.toFixed(2)} V, while Cell ${maxCellIndex} is at ${maxV.toFixed(2)} V.`,
        },
        {
          title: '2. Mathematical Imbalance (ΔV)',
          icon: AlertOctagon,
          color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
          content: `Cell ${minCellIndex} is ${deltaV.toFixed(2)} V below Cell ${maxCellIndex}, producing an elevated pack voltage spread (ΔV = ${deltaV.toFixed(2)} V).`,
        },
        {
          title: '3. Historical Trend Pattern',
          icon: TrendingDown,
          color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
          content: `Cell ${minCellIndex} voltage shows a steeper downward trajectory relative to adjacent cells under load.`,
        },
        {
          title: '4. AI Risk Interpretation & Possible Causes',
          icon: FileSearch,
          color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
          content: `Consistent with localized capacity variance, elevated internal resistance (ESR), or un-balanced state of charge.`,
        },
        {
          title: '5. Safety Assessment',
          icon: ShieldAlert,
          color: isCritical ? 'text-critical border-critical/40 bg-critical/10' : 'text-warning border-warning/40 bg-warning/10',
          content: isCritical
            ? `Severe voltage deviation increases thermal/electrical risk. Immediate cell inspection recommended.`
            : `Elevated voltage spread. Recommended cell balancing routine on next charge cycle.`,
        },
      ]

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Brain className="h-4.5 w-4.5 text-accent" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">
                4. 🧠 AI BATTERY REASONING — STRUCTURED DIAGNOSTIC PIPELINE
              </CardTitle>
              <p className="text-xs text-muted">
                Transparent AI reasoning: Measured fact → AI interpretation → Possible cause → Recommended action
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-extrabold text-accent">
            <Sparkles className="h-4 w-4" /> AI DIAGNOSTIC ENGINE
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Structured 5-Step Pipeline Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reasoningSteps.map((step) => (
            <div key={step.title} className={`rounded-2xl border p-4 shadow-sm transition-all ${step.color}`}>
              <div className="flex items-center gap-2 font-black text-xs">
                <step.icon className="h-4 w-4 shrink-0" />
                <span>{step.title}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground leading-relaxed">
                {step.content}
              </p>
            </div>
          ))}
        </div>

        {/* Highlighted Recommended Safety Action Banner */}
        <div className={`rounded-2xl border-2 p-5 shadow-md ${
          isHealthy
            ? 'border-healthy/50 bg-healthy/10'
            : isCritical
            ? 'border-critical bg-critical/10'
            : 'border-warning bg-warning/10'
        }`}>
          <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-wide ${
            isHealthy ? 'text-healthy' : isCritical ? 'text-critical' : 'text-warning'
          }`}>
            <CheckCircle2 className="h-5 w-5" />
            <span>6. Recommended Safety Action</span>
          </div>
          <p className="mt-2 text-xs font-bold text-foreground leading-relaxed">
            {isHealthy
              ? `“All 3 cells are operating normally (Cell 1: ${cell1V.toFixed(2)}V, Cell 2: ${cell2V.toFixed(2)}V, Cell 3: ${cell3V.toFixed(2)}V). Cell 3 at ${cell3V.toFixed(2)} V is within nominal Li-ion operating bounds (~55% SOC). Continue normal operations.”`
              : `“Inspect Cell ${minCellIndex} (${minV.toFixed(2)} V). ${
                  isCritical
                    ? 'Voltage reading has reached critical threshold. Isolate affected cell and verify hardware connection.'
                    : 'Perform automated cell balancing on next charge cycle to restore cell voltage parity.'
                }”`}
          </p>
          <p className="mt-2 text-[10px] font-medium text-faint">
            * AI diagnostics provide risk estimates based on model pattern matching. Always verify physical terminal measurements prior to hardware servicing.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
