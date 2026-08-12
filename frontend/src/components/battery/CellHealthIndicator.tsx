import type { CellStatus } from '@/types'
import { cn } from '@/utils/cn'

export function CellHealthIndicator({ status, className }: { status: CellStatus; className?: string }) {
  return (
    <span
      className={cn('relative flex h-2 w-2', className)}
      aria-hidden="true"
    >
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-60',
          status === 'healthy' ? 'bg-healthy' : status === 'warning' ? 'bg-warning' : 'bg-critical',
          'status-dot-pulse',
        )}
      />
      <span
        className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          status === 'healthy' ? 'bg-healthy' : status === 'warning' ? 'bg-warning' : 'bg-critical',
        )}
      />
    </span>
  )
}
