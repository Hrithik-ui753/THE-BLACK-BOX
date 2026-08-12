import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export function MetricDisplay({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  className,
}: {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  accent?: 'healthy' | 'warning' | 'critical' | 'accent'
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-semibold tabular-nums text-foreground',
          accent === 'healthy' && 'text-healthy',
          accent === 'warning' && 'text-warning',
          accent === 'critical' && 'text-critical',
          accent === 'accent' && 'text-accent-soft',
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-faint">{sub}</div>}
    </div>
  )
}
