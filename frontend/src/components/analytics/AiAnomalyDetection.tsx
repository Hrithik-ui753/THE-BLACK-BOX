import { AlertOctagon, Brain, ShieldAlert, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AiAnomalyDetectionProps {
  score?: number // 0-100
  abnormalBehavior?: string
  signals?: Array<{ label: string; pct: number }>
  possibleCauses?: string[]
}

export function AiAnomalyDetection({
  score = 94,
  abnormalBehavior = '⚠️ Voltage dropped unusually fast while temperature increased.',
  signals = [
    { label: 'Voltage deviation', pct: 87 },
    { label: 'Temperature rise', pct: 72 },
    { label: 'Current fluctuation', pct: 41 },
    { label: 'Thermal / Vibration deviation', pct: 18 },
  ],
  possibleCauses = [
    'Cell degradation or accelerated capacity fade',
    'Excessive load demand exceeding nominal continuous C-rate',
    'Increased internal resistance (ESR) in cell connections',
  ],
}: AiAnomalyDetectionProps) {
  // Determine severity label and badge style
  const getRating = (s: number) => {
    if (s <= 20) return { label: 'NORMAL', text: 'text-healthy', border: 'border-healthy/40', bg: 'bg-healthy/10' }
    if (s <= 50) return { label: 'MINOR ANOMALY', text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10' }
    if (s <= 75) return { label: 'SUSPICIOUS', text: 'text-warning', border: 'border-warning/40', bg: 'bg-warning/10' }
    return { label: 'CRITICAL ANOMALY', text: 'text-critical', border: 'border-critical/40', bg: 'bg-critical/10' }
  }

  const rating = getRating(score)

  const scale = [
    { range: '0–20', label: 'Normal', color: 'bg-healthy' },
    { range: '21–50', label: 'Minor', color: 'bg-cyan-400' },
    { range: '51–75', label: 'Suspicious', color: 'bg-warning' },
    { range: '76–100', label: 'Critical', color: 'bg-critical' },
  ]

  const timelineSteps = [
    { stage: 'Normal', time: '12:00', status: 'normal' },
    { stage: 'Normal', time: '12:10', status: 'normal' },
    { stage: 'Deviation', time: '12:20', status: 'warning' },
    { stage: 'Anomaly Detected', time: '12:30', status: 'critical' },
  ]

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Brain className="h-4.5 w-4.5 text-accent" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">4. 🧠 AI ANOMALY DETECTION</CardTitle>
              <p className="text-xs text-muted">Multivariate pattern detection beyond static threshold boundaries</p>
            </div>
          </div>

          {/* Anomaly Score Badge */}
          <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 font-extrabold ${rating.bg} ${rating.border}`}>
            <AlertOctagon className={`h-5 w-5 ${rating.text}`} />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">Anomaly Score</span>
              <span className={`text-sm font-black tabular-nums ${rating.text}`}>{score} / 100 — {rating.label}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Scale Legend Bar */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="text-faint uppercase tracking-wider text-[10px]">Anomaly Scale:</span>
          {scale.map((s) => (
            <div key={s.range} className="flex items-center gap-1.5 rounded-lg border border-line bg-background-2/60 px-2.5 py-1">
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              <span className="text-foreground">{s.range}:</span>
              <span className="text-muted">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Detected Abnormal Behavior Alert Strip */}
        <div className="rounded-2xl border border-critical/30 bg-critical/10 p-4">
          <div className="flex items-center gap-2 font-bold text-critical text-xs">
            <ShieldAlert className="h-4 w-4" />
            <span>Detected Abnormal Behavior</span>
          </div>
          <p className="mt-1.5 text-sm font-extrabold text-foreground">{abnormalBehavior}</p>
        </div>

        {/* Contributing Signals & Timeline Grid */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Contributing Signals Breakdown */}
          <div className="space-y-3 lg:col-span-7">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Contributing Anomaly Signals</h4>
            <div className="space-y-2.5">
              {signals.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-foreground">{s.label}</span>
                    <span className="tabular-nums text-critical">+{s.pct}% abnormal</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-critical transition-all duration-500" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Progression Timeline */}
          <div className="rounded-2xl border border-line bg-background-2/70 p-4 lg:col-span-5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Anomaly Timeline Sequence</h4>
            <div className="mt-4 flex items-center justify-between gap-1">
              {timelineSteps.map((step, idx) => (
                <div key={step.time} className="flex items-center gap-1">
                  <div className="flex flex-col items-center text-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${
                      step.status === 'critical'
                        ? 'border-critical bg-critical/20 text-critical'
                        : step.status === 'warning'
                        ? 'border-warning bg-warning/20 text-warning'
                        : 'border-healthy bg-healthy/20 text-healthy'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-foreground">{step.stage}</span>
                    <span className="text-[9px] text-faint">{step.time}</span>
                  </div>
                  {idx < timelineSteps.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-faint mb-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Interpretation & Possible Causes */}
        <div className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-xs space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            <span className="font-extrabold text-accent-soft">AI Pattern Analysis Interpretation</span>
          </div>
          <p className="leading-relaxed text-muted">
            “The combination of rapid voltage decline and simultaneous temperature increase differs significantly from normal battery charge/discharge behavior profiles.”
          </p>

          <div className="border-t border-accent/20 pt-3">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-foreground mb-2">
              Possible Causes (AI Diagnostic Recommendations)
            </span>
            <ul className="space-y-1.5 text-muted">
              {possibleCauses.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-accent">{idx + 1}.</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] font-medium text-faint">
              Note: Causes are generated via ML model pattern matching and should be verified with hardware diagnostics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
