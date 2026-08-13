import { Activity, BatteryMedium, Gauge, Thermometer, Zap, RotateCcw } from 'lucide-react'
import type { PackTelemetry } from '@/types'
import { MetricDisplay } from './MetricDisplay'
import { fmtAmp, fmtPct, fmtTemp, fmtV } from '@/utils/format'

export function BatteryMetrics({ pack }: { pack: PackTelemetry }) {
  const sohVal = pack.soh ?? 90
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-6">
      <MetricDisplay label="SOH" value={pack.soh !== null && pack.soh !== undefined ? fmtPct(pack.soh) : '--'} icon={Gauge} accent={sohVal > 90 ? 'healthy' : sohVal > 80 ? 'warning' : 'critical'} />
      <MetricDisplay label="SOC" value={pack.soc !== null && pack.soc !== undefined ? fmtPct(pack.soc) : '--'} icon={BatteryMedium} />
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
