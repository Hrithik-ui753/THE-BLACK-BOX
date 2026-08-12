import { AlertOctagon, Brain, CheckCircle2, Eye, FileSearch, ShieldAlert, Sparkles, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AiBatteryReasoningProps {
  cell1V?: number
  cell2V?: number
  cell3V?: number
}

export function AiBatteryReasoning({
  cell1V = 3.60,
  cell2V = 3.60,
  cell3V = 1.10,
}: AiBatteryReasoningProps) {
  const maxV = Math.max(cell1V, cell2V, cell3V)
  const deltaV = maxV - cell3V

  const reasoningSteps = [
    {
      title: '1. Fact Observation (Measured Fact)',
      icon: Eye,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      content: `Cell 3 is currently operating at ${cell3V.toFixed(2)} V, while Cell 1 (${cell1V.toFixed(2)} V) and Cell 2 (${cell2V.toFixed(2)} V) are functioning normally at optimal operating voltage.`,
    },
    {
      title: '2. Mathematical Deviation',
      icon: AlertOctagon,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      content: `Cell 3 is ${deltaV.toFixed(2)} V below the highest cell, creating a severe pack voltage imbalance (ΔV = ${deltaV.toFixed(2)} V).`,
    },
    {
      title: '3. Historical Trend Pattern',
      icon: TrendingDown,
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      content: `Cell 3 voltage has exhibited a continuous steep downward degradation curve over recent operating charge cycles.`,
    },
    {
      title: '4. AI Risk Interpretation & Possible Causes',
      icon: FileSearch,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
      content: `This severe voltage deviation is consistent with potential cell degradation, abnormal self-discharge, increased internal resistance (ESR), measurement sensor error, or physical cell damage.`,
    },
    {
      title: '5. Safety Assessment',
      icon: ShieldAlert,
      color: 'text-critical border-critical/40 bg-critical/10',
      content: `Continued operation under this severe imbalance condition increases the risk of thermal/electrical battery instability, capacity collapse, and further pack degradation.`,
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
        <div className="rounded-2xl border-2 border-critical bg-critical/10 p-5 shadow-md">
          <div className="flex items-center gap-2 font-black text-critical text-sm uppercase tracking-wide">
            <CheckCircle2 className="h-5 w-5" />
            <span>6. Recommended Safety Action</span>
          </div>
          <p className="mt-2 text-xs font-bold text-foreground leading-relaxed">
            “Inspect Cell 3 immediately. If the voltage reading ({cell3V.toFixed(2)} V) is verified, isolate the affected cell and consider replacement according to the battery manufacturer&apos;s safety procedure.”
          </p>
          <p className="mt-2 text-[10px] font-medium text-faint">
            * AI diagnostics provide risk estimates based on model pattern matching. Always verify physical terminal measurements prior to hardware servicing.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
