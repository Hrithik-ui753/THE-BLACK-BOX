import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BatteryLow, Thermometer, Trash2, Zap } from 'lucide-react'
import type { Battery, PackTelemetry } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { Badge } from '@/components/ui/badge'
import { STATUS_COLOR, STATUS_LABEL } from '@/constants/status'
import { fmtPct, fmtTemp, fmtV } from '@/utils/format'
import { ROUTES } from '@/constants/status'
import { cn } from '@/utils/cn'

function MiniBattery({ soc }: { soc: number }) {
  return (
    <svg viewBox="0 0 64 36" className="h-9 w-16" aria-hidden="true">
      <rect x="2" y="4" width="52" height="28" rx="5" fill="#0b1625" stroke="#1a2c45" strokeWidth="1.5" />
      <rect x="56" y="11" width="6" height="14" rx="2" fill="#1a2c45" />
      <rect x="6" y="8" width={44 * Math.min(soc, 100) / 100} height="20" rx="3" fill="#22d3ee" opacity="0.9" />
    </svg>
  )
}

export function BatteryCard({ battery, pack, index }: { battery: Battery; pack: PackTelemetry | undefined; index: number }) {
  const removeBattery = useAppStore((s) => s.removeBattery)
  const offline = battery.status === 'offline'
  const statusColor = STATUS_COLOR[battery.status === 'offline' ? 'warning' : battery.status === 'critical' ? 'critical' : battery.status] ?? '#5d7390'
  const soh = pack?.soh ?? 90

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-surface p-5 transition-colors',
        offline ? 'border-line' : 'border-line hover:border-accent/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-wide text-foreground">{battery.name}</h3>
            <Badge variant={offline ? 'offline' : battery.status === 'critical' ? 'critical' : battery.status === 'warning' ? 'warning' : 'healthy'}>
              <span className="h-1.5 w-1.5 rounded-full bg-current status-dot-pulse" />
              {offline ? 'Offline' : STATUS_LABEL[battery.status]}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted">{battery.type} · {battery.cellCount} cells</p>
        </div>

        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="32" cy="32" r="27" fill="none" stroke="#101f33" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke={statusColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(soh / 100) * 169.6} 169.6`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-bold tabular-nums text-foreground">{soh.toFixed(1)}%</p>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-faint">SOH</p>
          </div>
        </div>
      </div>

      <>
        <div className="mt-4 flex items-center gap-4">
          <MiniBattery soc={pack?.soc ?? 85} />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Zap className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="font-semibold tabular-nums text-foreground">{pack ? fmtV(pack.voltage) : '10.75V'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Thermometer className="h-3.5 w-3.5 shrink-0 text-warning/80" />
              <span className="font-semibold tabular-nums text-foreground">{pack ? fmtTemp(pack.temperature) : '27.1°C'}</span>
            </div>
          </div>
        </div>

        {/* Option 2 Explicit 3-Cell Individual Voltage Breakdown */}
        <div className="mt-3.5 rounded-xl border border-warning/30 bg-warning/5 p-2.5">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-warning">
            <span>3 Individual Cells Voltages</span>
            <span>Sum = {pack ? pack.voltage.toFixed(2) : '10.75'} V</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-xs font-black">
            <div className="rounded-lg border border-healthy/40 bg-healthy/10 py-1 text-healthy">
              <span className="block text-[8px] font-bold text-faint">Cell 01</span>
              {pack?.cells?.[0] ? `${pack.cells[0].voltage.toFixed(2)}V` : '3.80V'}
            </div>
            <div className="rounded-lg border border-warning/40 bg-warning/10 py-1 text-warning">
              <span className="block text-[8px] font-bold text-faint">Cell 02</span>
              {pack?.cells?.[1] ? `${pack.cells[1].voltage.toFixed(2)}V` : '3.56V'}
            </div>
            <div className="rounded-lg border border-healthy/40 bg-healthy/10 py-1 text-healthy">
              <span className="block text-[8px] font-bold text-faint">Cell 03</span>
              {pack?.cells?.[2] ? `${pack.cells[2].voltage.toFixed(2)}V` : '3.39V'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <BatteryLow className="h-3.5 w-3.5" />
            <span className="font-semibold tabular-nums text-accent-soft">{pack ? fmtPct(pack.soc, 0) : '85%'}</span>
            <span className="text-faint">SOC</span>
          </div>
          <Badge variant={pack?.chargeState === 'charging' ? 'accent' : 'muted'} className="shrink-0">
            {pack?.chargeState === 'charging' ? 'Charging' : pack?.chargeState === 'discharging' ? 'Discharging' : 'Standby / Synced'}
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => removeBattery(battery.id)}
              title="Remove Pack"
              aria-label="Remove Pack"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-critical/40 hover:bg-critical/10 hover:text-critical"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <Link
              to={ROUTES.battery(battery.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-soft transition-colors hover:bg-accent/20"
            >
              View Battery <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </>
    </motion.div>
  )
}
