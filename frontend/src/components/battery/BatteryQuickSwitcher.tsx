import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { STATUS_COLOR } from '@/constants/status'
import { cn } from '@/utils/cn'

export function BatteryQuickSwitcher({ currentBatteryId }: { currentBatteryId?: string }) {
  const navigate = useNavigate()
  const batteries = useAppStore((s) => s.batteries)
  const selectBattery = useAppStore((s) => s.selectBattery)
  const telemetry = useAppStore((s) => s.telemetry)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface/90 p-1.5 shadow-sm backdrop-blur-md">
      <span className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-faint">
        Select Battery:
      </span>
      {batteries.map((b) => {
        const active = b.id === currentBatteryId
        const pack = telemetry[b.id]
        const statusKey = b.status === 'offline' || b.status === 'CELL_MISSING' ? 'warning' : b.status === 'critical' ? 'critical' : b.status
        const color = STATUS_COLOR[statusKey] ?? '#f59e0b'

        return (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              selectBattery(b.id)
              navigate(`/battery/${b.id}`)
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
              active
                ? 'bg-accent/15 text-accent border border-accent/40 shadow-sm'
                : 'bg-background-2/60 text-muted border border-line hover:border-accent/30 hover:text-foreground',
            )}
          >
            <span className="h-2 w-2 rounded-full status-dot-pulse" style={{ backgroundColor: color }} />
            <span>{b.name}</span>
            <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground dark:bg-slate-800/70">
              {pack?.soh !== null && pack?.soh !== undefined ? `${pack.soh.toFixed(0)}% SOH` : b.status === 'offline' ? 'OFFLINE' : '-- SOH'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
