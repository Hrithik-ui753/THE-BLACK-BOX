import { useMemo } from 'react'
import { AlertCircle, Flame, ShieldAlert, Thermometer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TelemetryChart } from './TelemetryChart'
import { baseLineOption, lineSeries } from '@/utils/chartOptions'
import type { PackTelemetry } from '@/types'

export interface ThermalRiskPredictionProps {
  pack: PackTelemetry
  riseRate?: number // °C/min
  historyLabels?: string[]
  tempHistoryData?: number[]
}

export function ThermalRiskPrediction({
  pack,
  riseRate = 2.1,
  historyLabels = ['-15m', '-12m', '-9m', '-6m', '-3m', 'NOW', '+3m (Pred)', '+6m (Pred)'],
  tempHistoryData,
}: ThermalRiskPredictionProps) {
  const currentTemp = pack.temperature ?? 48.0

  // Calculate prediction math
  const { riskLevel, timeToCriticalMin, riskBadgeBg } = useMemo(() => {
    const criticalThreshold = 55.0
    const warningThreshold = 45.0
    const diff = criticalThreshold - currentTemp

    let risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    let timeEst = 99
    let badge = 'bg-healthy/10 text-healthy border-healthy/40'

    if (currentTemp >= criticalThreshold) {
      risk = 'CRITICAL'
      timeEst = 0
      badge = 'bg-critical/10 text-critical border-critical/40'
    } else if (riseRate > 0) {
      timeEst = Math.max(parseFloat((diff / riseRate).toFixed(1)), 0.1)
      if (timeEst <= 5 || currentTemp >= warningThreshold) {
        risk = 'HIGH'
        badge = 'bg-critical/10 text-critical border-critical/40'
      } else if (timeEst <= 15) {
        risk = 'MEDIUM'
        badge = 'bg-warning/10 text-warning border-warning/40'
      }
    }

    return { riskLevel: risk, timeToCriticalMin: timeEst, riskBadgeBg: badge }
  }, [currentTemp, riseRate])

  // Build projected timeline chart data
  const chartOption = useMemo(() => {
    const historicalCount = 6
    const baseHistorical = tempHistoryData ?? [38.2, 40.1, 42.4, 44.5, 46.2, currentTemp]
    const actualSeries = baseHistorical.slice(0, historicalCount)

    // Project future curve
    const proj1 = Math.round((currentTemp + riseRate * 3) * 10) / 10
    const proj2 = Math.round((currentTemp + riseRate * 6) * 10) / 10

    const actualData = [...actualSeries, null, null]
    const predData = [null, null, null, null, null, currentTemp, proj1, proj2]

    return baseLineOption(
      historyLabels,
      [
        lineSeries(actualData, { name: 'Actual Temp (°C)', color: '#f59e0b', width: 3 }),
        lineSeries(predData, { name: 'Projected Rise (°C)', color: '#ef4444', width: 3, dashed: true }),
      ],
      {
        yName: '°C',
        min: 30,
        max: 65,
        markLine: {
          data: [
            { yAxis: 45, name: 'Warning (45°C)', itemStyle: { color: '#f59e0b' } },
            { yAxis: 55, name: 'Critical (55°C)', itemStyle: { color: '#ef4444' } },
          ],
        },
      },
    )
  }, [currentTemp, riseRate, historyLabels, tempHistoryData])

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-warning/30 bg-warning/10">
              <Flame className="h-4.5 w-4.5 text-warning" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">3. 🌡️ THERMAL RISK PREDICTION</CardTitle>
              <p className="text-xs text-muted">Real-time thermal trajectory & projected runaway safety model</p>
            </div>
          </div>

          {/* Predicted Thermal Risk Badge */}
          <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 font-extrabold ${riskBadgeBg}`}>
            <ShieldAlert className="h-5 w-5" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">Predicted Thermal Risk</span>
              <span className="text-sm font-black">{riskLevel} RISK</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Current Temp</span>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums text-foreground">
              <Thermometer className="h-4 w-4 text-warning" />
              <span>{currentTemp.toFixed(1)} °C</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Rise Rate</span>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums text-critical">
              <Flame className="h-4 w-4" />
              <span>+{riseRate.toFixed(1)} °C/min</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">Critical Limit</span>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums text-foreground">
              <span>55.0 °C</span>
            </div>
          </div>

          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-warning">Est. Time to Critical</span>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums text-warning">
              <span>~{timeToCriticalMin} min</span>
            </div>
          </div>
        </div>

        {/* Operating Range Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="text-faint uppercase tracking-wider text-[10px]">Thermal Bounds:</span>
          <div className="rounded-lg border border-healthy/30 bg-healthy/10 px-2.5 py-1 text-healthy">&lt; 45°C Normal</div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1 text-warning">45–55°C Warning</div>
          <div className="rounded-lg border border-critical/30 bg-critical/10 px-2.5 py-1 text-critical">&gt; 55°C Critical</div>
        </div>

        {/* Projected Temperature Chart */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">Temperature Timeline & Projected Trajectory (°C)</h4>
            <span className="text-[11px] font-semibold text-critical">Dashed = AI Future Forecast</span>
          </div>
          <TelemetryChart height={240} ariaLabel="Temperature Timeline & Projection" option={chartOption} />
        </div>

        {/* Urgency Alert Card */}
        <div className="flex items-start gap-3 rounded-2xl border border-critical/30 bg-critical/10 p-4 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-critical" />
          <div>
            <strong className="block text-critical font-bold">Thermal Urgency Warning:</strong>
            <p className="mt-1 leading-relaxed text-muted">
              “At the current heating rate (<span className="font-bold text-foreground">+{riseRate.toFixed(1)} °C/min</span>), the battery is projected to breach the critical thermal threshold (55.0 °C) in approximately <strong className="text-critical">{timeToCriticalMin} minutes</strong>.”
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
