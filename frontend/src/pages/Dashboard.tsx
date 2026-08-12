import { ShieldCheck, TriangleAlert, BatteryMedium, WifiOff, Cpu, Plus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { BatteryCard } from '@/components/battery/BatteryCard'
import { BatteryQuickSwitcher } from '@/components/battery/BatteryQuickSwitcher'
import { Button } from '@/components/ui/button'
import { usePack } from '@/hooks/usePack'
import type { Battery } from '@/types'

function BatteryCardRow({ battery, index }: { battery: Battery; index: number }) {
  const pack = usePack(battery.id)
  return <BatteryCard battery={battery} pack={pack} index={index} />
}

export function Dashboard() {
  const rawBatteries = useAppStore((s) => s.batteries)
  const addBattery = useAppStore((s) => s.addBattery)
  const batteries = (rawBatteries || []).filter(Boolean)

  const handleAddDevice = () => {
    const nextNum = batteries.length + 1
    const newBattery: Battery = {
      id: `battery-${String(nextNum).padStart(2, '0')}`,
      userId: 'user',
      name: `3 Individual Cells Module (Pack ${nextNum})`,
      type: 'Modular · 3x Individual Cells (Cell 1, Cell 2, Cell 3)',
      mode: 'individual_cells',
      cellCount: 3,
      status: 'healthy',
      deviceId: `ESP32-77BC0${nextNum}`,
      createdAt: Date.now(),
    }
    addBattery(newBattery)
  }

  const healthyCount = batteries.filter((b) => b?.status === 'healthy').length
  const warningCount = batteries.filter((b) => b?.status === 'warning').length
  const criticalCount = batteries.filter((b) => b?.status === 'critical').length
  const offlineCount = batteries.filter((b) => b?.status === 'offline').length

  const summary = [
    { label: 'Healthy Packs', value: healthyCount, icon: ShieldCheck, color: 'text-healthy' },
    { label: 'Warning Packs', value: warningCount, icon: TriangleAlert, color: 'text-warning' },
    { label: 'Critical Packs', value: criticalCount, icon: BatteryMedium, color: 'text-critical' },
    { label: 'Offline / Standby', value: offlineCount, icon: WifiOff, color: 'text-faint' },
  ]

  const gridLayout =
    batteries.length === 1
      ? 'grid-cols-1 max-w-xl mx-auto'
      : batteries.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
              <Cpu className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Battery Command Center</h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Configured for {batteries.length} {batteries.length === 1 ? 'Battery Pack' : 'Battery Packs'} · Real-time cell telemetry & AI health models.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2 text-xs font-black text-foreground shadow-sm">
            <Cpu className="h-4 w-4 text-accent" />
            <span>3 Individual Cells Module (Cell 1, Cell 2, Cell 3)</span>
          </div>

          <Button size="sm" onClick={handleAddDevice} className="gap-1.5 font-bold">
            <Plus className="h-4 w-4" /> Add Battery Unit
          </Button>

          <BatteryQuickSwitcher />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3.5 shadow-sm backdrop-blur-sm transition-all hover:border-accent/30">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-xl font-extrabold tabular-nums text-foreground">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {batteries.length === 1
            ? 'Single Battery Monitor (Battery 01)'
            : batteries.length === 2
            ? 'Dual Battery Array (Battery 01 & Battery 02)'
            : 'Triple Battery Matrix (Battery 01, Battery 02 & Battery 03)'}
        </h2>
        <span className="text-[11px] font-medium text-faint">Live Cloud Database Sync · 1.5s refresh</span>
      </div>

      <div className={`mt-4 grid gap-5 ${gridLayout}`}>
        {batteries.map((b, i) => (
          <BatteryCardRow key={b.id} battery={b} index={i} />
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-faint">
        Hardware-to-cloud multi-battery architecture · Configured for {batteries.length} active battery {batteries.length === 1 ? 'unit' : 'units'}
      </p>
    </div>
  )
}


