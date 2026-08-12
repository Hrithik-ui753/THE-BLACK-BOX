import { Activity, Brain, Shield, Thermometer, Zap, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface BatteryHealthGaugeProps {
  score: number // 0-100
  electricalStability: number
  thermalCondition: number
  cellBalance: number
  safetyCondition: number
  degradationScore: number
  healthChange7d?: number
  aiExplanation?: string
}

export function BatteryHealthGauge({
  score = 82,
  electricalStability = 78,
  thermalCondition = 91,
  cellBalance = 74,
  safetyCondition = 88,
  degradationScore = 79,
  healthChange7d = -3.2,
  aiExplanation = 'Battery health is GOOD, but cell imbalance and increasing temperature are reducing the overall score.',
}: BatteryHealthGaugeProps) {
  // Label and Color based on score
  const getRating = (s: number) => {
    if (s >= 90) return { label: 'EXCELLENT', color: '#10b981', textColor: 'text-healthy', border: 'border-healthy' }
    if (s >= 75) return { label: 'GOOD', color: '#22d3ee', textColor: 'text-accent-soft', border: 'border-accent' }
    if (s >= 50) return { label: 'WARNING', color: '#f59e0b', textColor: 'text-warning', border: 'border-warning' }
    if (s >= 25) return { label: 'POOR', color: '#ea580c', textColor: 'text-orange-500', border: 'border-orange-500' }
    return { label: 'CRITICAL', color: '#ef4444', textColor: 'text-critical', border: 'border-critical' }
  }

  const rating = getRating(score)

  // Radial SVG Math
  const radius = 72
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const factors = [
    { label: 'Electrical Stability', value: electricalStability, icon: Zap, color: 'bg-cyan-500' },
    { label: 'Thermal Condition', value: thermalCondition, icon: Thermometer, color: 'bg-amber-500' },
    { label: 'Cell Balance', value: cellBalance, icon: Activity, color: 'bg-indigo-500' },
    { label: 'Safety Condition', value: safetyCondition, icon: Shield, color: 'bg-emerald-500' },
    { label: 'Battery Degradation', value: degradationScore, icon: TrendingDown, color: 'bg-rose-500' },
  ]

  const ranges = [
    { range: '90–100', label: 'Excellent', color: 'bg-healthy' },
    { range: '75–89', label: 'Good', color: 'bg-accent' },
    { range: '50–74', label: 'Warning', color: 'bg-warning' },
    { range: '25–49', label: 'Poor', color: 'bg-orange-500' },
    { range: '0–24', label: 'Critical', color: 'bg-critical' },
  ]

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Zap className="h-4.5 w-4.5 text-accent" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">1. 🔋 BATTERY HEALTH SCORE — PRIMARY KPI</CardTitle>
              <p className="text-xs text-muted">Comprehensive multi-vector condition index (0–100)</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <TrendingDown className="h-3.5 w-3.5 text-warning" />
            <span>Health Change: {healthChange7d > 0 ? `+${healthChange7d}` : healthChange7d} pts / 7d</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Radial Circular Gauge */}
          <div className="flex flex-col items-center justify-center lg:col-span-5">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="#101f33"
                  strokeWidth={strokeWidth}
                />
                {/* Progress Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={rating.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black tabular-nums text-foreground">{score}</span>
                <span className="text-xs font-bold tracking-widest text-faint">/ 100</span>
                <span className={`mt-1 text-xs font-black tracking-wider uppercase ${rating.textColor}`}>
                  {rating.label}
                </span>
              </div>
            </div>

            {/* Severity Ranges Scale Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold">
              {ranges.map((r) => (
                <div key={r.range} className="flex items-center gap-1.5 rounded-md border border-line bg-background-2 px-2 py-1">
                  <span className={`h-2 w-2 rounded-full ${r.color}`} />
                  <span className="text-foreground">{r.range}:</span>
                  <span className="text-muted">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown & AI Explanation */}
          <div className="space-y-4 lg:col-span-7">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Health Factor Breakdown</h4>

            <div className="space-y-2.5">
              {factors.map((f) => (
                <div key={f.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2 text-foreground">
                      <f.icon className="h-3.5 w-3.5 text-muted" />
                      {f.label}
                    </span>
                    <span className="tabular-nums text-foreground">{f.value} / 100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full ${f.color} transition-all duration-700`}
                      style={{ width: `${f.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Short AI Explanation Card */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-3.5 text-xs">
              <Brain className="h-4 w-4 shrink-0 text-accent" />
              <p className="font-medium text-muted leading-relaxed">
                <strong className="text-accent font-bold">AI Diagnosis: </strong>
                “{aiExplanation}”
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
