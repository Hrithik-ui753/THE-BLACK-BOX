import { useMemo } from 'react'
import { AlertCircle, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TelemetryChart } from './TelemetryChart'
import { baseLineOption, lineSeries } from '@/utils/chartOptions'

export interface VoltageDegradationGraphProps {
  timeLabels?: string[]
  cell1Data?: number[]
  cell2Data?: number[]
  cell3Data?: number[]
}

export function VoltageDegradationGraph({
  timeLabels = ['T1 (Cycle 10)', 'T2 (Cycle 35)', 'T3 (Cycle 70)', 'T4 (Cycle 142)'],
  cell1Data = [3.62, 3.61, 3.60, 3.60],
  cell2Data = [3.61, 3.60, 3.60, 3.60],
  cell3Data = [3.60, 2.90, 1.85, 1.10],
}: VoltageDegradationGraphProps) {
  const initialV = cell3Data[0] ?? 3.60
  const finalV = cell3Data[cell3Data.length - 1] ?? 1.10
  const dropV = finalV - initialV
  const dropPct = Math.round(Math.abs((dropV / initialV) * 100))

  const chartOption = useMemo(() => {
    return baseLineOption(
      timeLabels,
      [
        lineSeries(cell1Data, { name: 'Cell 1 (Healthy)', color: '#38bdf8', width: 3 }),
        lineSeries(cell2Data, { name: 'Cell 2 (Healthy)', color: '#34d399', width: 3 }),
        lineSeries(cell3Data, { name: 'Cell 3 (Critical Drop)', color: '#ef4444', width: 4 }),
      ],
      {
        yName: 'V',
        min: 1.0,
        max: 4.2,
        markLine: {
          data: [
            { yAxis: 2.8, name: 'Critical Voltage Threshold (2.8V)', itemStyle: { color: '#ef4444' } },
            { yAxis: 3.2, name: 'Warning Threshold (3.2V)', itemStyle: { color: '#f59e0b' } },
          ],
        },
      },
    )
  }, [timeLabels, cell1Data, cell2Data, cell3Data])

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-critical/30 bg-critical/10">
              <TrendingDown className="h-4.5 w-4.5 text-critical" />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">
                2. 📉 VOLTAGE DEGRADATION GRAPH — DAMAGE OVER TIME
              </CardTitle>
              <p className="text-xs text-muted">Per-cell voltage trajectory across operational cycle timeline</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-black ${finalV < 2.8 || dropPct > 15 ? 'border-critical/40 bg-critical/10 text-critical' : 'border-healthy/40 bg-healthy/10 text-healthy'}`}>
            <AlertCircle className="h-4 w-4" />
            <span>{finalV < 2.8 || dropPct > 15 ? 'CRITICAL VOLTAGE DROP DETECTED' : 'LIVE VOLTAGE TRAJECTORY'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Metric Badges Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Cell 3 Initial Voltage</span>
            <span className="mt-1 block text-lg font-black tabular-nums text-foreground">{initialV.toFixed(2)} V</span>
          </div>

          <div className="rounded-2xl border border-line bg-background-2/70 p-3.5">
            <span className="block text-[10px] font-bold uppercase text-faint">Cell 3 Current Voltage</span>
            <span className={`mt-1 block text-lg font-black tabular-nums ${finalV < 2.8 ? 'text-critical' : finalV < 3.3 ? 'text-warning' : 'text-healthy'}`}>{finalV.toFixed(2)} V</span>
          </div>

          <div className={`rounded-2xl border p-3.5 ${finalV < 2.8 || dropPct > 15 ? 'border-critical/40 bg-critical/10 text-critical' : 'border-line bg-background-2/70 text-foreground'}`}>
            <span className="block text-[10px] font-bold uppercase">Voltage Change</span>
            <span className="mt-1 block text-lg font-black tabular-nums">{dropV.toFixed(2)} V</span>
          </div>

          <div className={`rounded-2xl border p-3.5 ${finalV < 2.8 || dropPct > 15 ? 'border-critical/40 bg-critical/10 text-critical' : 'border-healthy/40 bg-healthy/10 text-healthy'}`}>
            <span className="block text-[10px] font-bold uppercase">Voltage Reduction</span>
            <span className="mt-1 block text-lg font-black tabular-nums">~{dropPct}% Change</span>
          </div>
        </div>

        {/* Degradation Line Chart */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Cell Terminal Voltage vs Time / Charge Cycles (V)
            </h4>
            <span className={`text-[11px] font-bold ${finalV < 2.8 ? 'text-critical' : 'text-accent'}`}>{finalV < 2.8 ? 'Red Line = Critical Cell 3 Drop' : 'Real-time telemetry timeline'}</span>
          </div>
          <TelemetryChart height={280} ariaLabel="Cell Voltage Degradation Over Time" option={chartOption} />
        </div>

        {/* Explanation Alert */}
        <div className={`rounded-2xl border p-4 text-xs font-medium ${finalV < 2.8 ? 'border-critical/30 bg-critical/10 text-muted' : 'border-accent/20 bg-accent/5 text-muted'}`}>
          <strong className={`block font-bold text-sm mb-1 ${finalV < 2.8 ? 'text-critical' : 'text-accent'}`}>
            {finalV < 2.8 ? '⚠️ Critical Threshold Breach Analysis:' : 'ℹ️ Live Cell Voltage Trajectory Analysis:'}
          </strong>
          {finalV < 2.8
            ? `Cell 1 and Cell 2 remain stable, while Cell 3 has suffered a drop of ${dropV.toFixed(2)} V (~${dropPct}%) down to ${finalV.toFixed(2)} V, breaching the 2.80 V cutoff threshold.`
            : `Cell 1 (${cell1Data[cell1Data.length - 1]?.toFixed(2)}V), Cell 2 (${cell2Data[cell2Data.length - 1]?.toFixed(2)}V), and Cell 3 (${finalV.toFixed(2)}V) are operating continuously within healthy voltage bounds.`}
        </div>
      </CardContent>
    </Card>
  )
}
