import { useMemo } from 'react'
import { Brain, Gauge, Info, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TelemetryChart } from './TelemetryChart'
import { baseLineOption, lineSeries } from '@/utils/chartOptions'
import type { PackTelemetry } from '@/types'

export interface SohDegradationPredictionProps {
  pack: PackTelemetry
  degradationRateWeek?: number // % per week
  degradationRateCycle?: number // % per cycle
  cyclesTo70?: number
}

export function SohDegradationPrediction({
  pack,
  degradationRateWeek = -0.6,
  degradationRateCycle = -0.04,
  cyclesTo70 = 120,
}: SohDegradationPredictionProps) {
  const currentSoh = pack.soh ?? 82.0
  const currentCycles = pack.cycleCount ?? 142

  // Predicted SOH after 30 cycles
  const predSoh30Cycles = Math.max(parseFloat((currentSoh + degradationRateCycle * 30).toFixed(1)), 50.0)

  // Chart series with actual historical data + future prediction shading
  const chartOption = useMemo(() => {
    const labels = [
      `C${currentCycles - 100}`,
      `C${currentCycles - 75}`,
      `C${currentCycles - 50}`,
      `C${currentCycles - 25}`,
      `C${currentCycles} (NOW)`,
      `C${currentCycles + 30} (Pred)`,
      `C${currentCycles + 60} (Pred)`,
      `C${currentCycles + 90} (Pred)`,
    ]

    const actualData = [98.0, 94.5, 91.0, 86.5, currentSoh, null, null, null]
    const predData = [
      null,
      null,
      null,
      null,
      currentSoh,
      predSoh30Cycles,
      Math.max(parseFloat((currentSoh + degradationRateCycle * 60).toFixed(1)), 45.0),
      Math.max(parseFloat((currentSoh + degradationRateCycle * 90).toFixed(1)), 40.0),
    ]

    return baseLineOption(
      labels,
      [
        lineSeries(actualData, { name: 'Actual SOH (%)', color: '#10b981', width: 3 }),
        lineSeries(predData, { name: 'Predicted SOH Forecast (%)', color: '#22d3ee', width: 3, dashed: true }),
      ],
      {
        yName: '%',
        min: 60,
        max: 100,
        markLine: {
          data: [{ yAxis: 70, name: 'EndOfLife Threshold (70%)', itemStyle: { color: '#ef4444' } }],
        },
      },
    )
  }, [currentSoh, currentCycles, degradationRateCycle, predSoh30Cycles])

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-healthy/30 bg-healthy/10">
              <Gauge className="h-4.5 w-4.5 text-healthy" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">5. 📉 SOH + DEGRADATION PREDICTION</CardTitle>
              <p className="text-xs text-muted">Remaining capacity trajectory & long-term RUL cycle forecasting</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-line bg-background-2/80 px-3.5 py-1.5 font-bold text-xs">
            <TrendingDown className="h-4 w-4 text-warning" />
            <span>Degradation: <strong className="text-foreground">{degradationRateWeek}% / week</strong></span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* State of Health Primary Cards Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">State of Health (SOH)</span>
            <div className="mt-1 flex items-center gap-1 text-xl font-black tabular-nums text-foreground">
              <span>{currentSoh.toFixed(1)}%</span>
            </div>
            <span className="text-[10px] font-semibold text-muted">Usable Capacity Ratio</span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Degradation Rate</span>
            <div className="mt-1 flex items-center gap-1 text-lg font-black tabular-nums text-warning">
              <span>{degradationRateCycle}% / cycle</span>
            </div>
            <span className="text-[10px] font-semibold text-muted">Cycle Loss Slope</span>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">Predicted in 30 Cycles</span>
            <div className="mt-1 flex items-center gap-1 text-lg font-black tabular-nums text-accent-soft">
              <span>{predSoh30Cycles}%</span>
            </div>
            <span className="text-[10px] font-semibold text-muted">Projected Capacity</span>
          </div>

          <div className="rounded-2xl border border-critical/30 bg-critical/10 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-critical">Est. Cycles to 70% SOH</span>
            <div className="mt-1 flex items-center gap-1 text-lg font-black tabular-nums text-critical">
              <span>~{cyclesTo70} cycles</span>
            </div>
            <span className="text-[10px] font-bold text-critical">End-of-Life Horizon</span>
          </div>
        </div>

        {/* Capacity Definition Banner */}
        <div className="flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3.5 py-2.5 text-xs text-muted dark:bg-slate-800/60">
          <Info className="h-4 w-4 text-accent shrink-0" />
          <span>
            <strong className="text-foreground font-bold">What is SOH? </strong>
            State of Health (SOH) estimates the battery&apos;s remaining usable capacity relative to a brand-new reference pack (100%).
          </span>
        </div>

        {/* Historical + Forecast SOH Chart */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">SOH (%) vs Charge Cycles Forecast</h4>
            <span className="text-[11px] font-bold text-accent">AI Model Prediction Region (Dashed)</span>
          </div>
          <TelemetryChart height={240} ariaLabel="SOH degradation & forecast" option={chartOption} />
        </div>

        {/* AI Disclaimer & Explanation Card */}
        <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 text-xs">
          <Brain className="h-5 w-5 shrink-0 text-accent" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-accent-soft">
              <span>AI Health Forecast Assessment</span>
              <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[9px] font-extrabold text-accent">
                AI ESTIMATE — NOT A GUARANTEED FAILURE DATE
              </span>
            </div>
            <p className="leading-relaxed text-muted">
              “The battery is showing gradual capacity degradation ({degradationRateWeek}%/week). At the current estimated degradation rate, SOH is projected to decline below the 70% End-of-Life threshold after approximately <strong className="text-foreground">{cyclesTo70} charge cycles</strong>.”
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
