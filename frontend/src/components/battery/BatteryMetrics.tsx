import { Activity, BatteryMedium, Gauge, Thermometer, Zap, RotateCcw } from 'lucide-react'
import type { PackTelemetry } from '@/types'
import { MetricDisplay } from './MetricDisplay'
import { fmtAmp, fmtPct, fmtTemp, fmtV } from '@/utils/format'

export function BatteryMetrics({ pack }: { pack: PackTelemetry }) {
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-6">
      <MetricDisplay label="SOH" value={fmtPct(pack.soh)} icon={Gauge} accent={pack.soh > 90 ? 'healthy' : pack.soh > 80 ? 'warning' : 'critical'} />
      <MetricDisplay label="SOC" value={fmtPct(pack.soc)} icon={BatteryMedium} />
      <MetricDisplay label="Pack Voltage" value={fmtV(pack.voltage)} icon={Zap} />
      <MetricDisplay
        label="Temperature"
        value={fmtTemp(pack.temperature)}
        icon={Thermometer}
        accent={pack.temperature > 36 ? 'critical' : pack.temperature > 32.5 ? 'warning' : undefined}
      />
      <MetricDisplay label="Estimated Current" value={fmtAmp(pack.current)} icon={Activity} />
      <MetricDisplay label="Cycles" value={String(pack.cycleCount)} icon={RotateCcw} />
    </div>
  )
}
