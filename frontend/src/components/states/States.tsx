import { motion } from 'framer-motion'
import { BatteryCharging, RefreshCw, PlugZap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function LoadingState({
  message = 'Connecting to battery...',
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 text-center', className)}>
      <div className="relative flex h-14 w-14 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-accent/30"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
        <BatteryCharging className="h-7 w-7 text-accent" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="mt-1 text-xs text-muted">Establishing telemetry link…</p>
      </div>
    </div>
  )
}

export function ErrorState({
  title = 'Battery connection interrupted',
  message = 'We lost the live telemetry stream from the device.',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-critical/30 bg-critical/5 py-16 text-center">
      <PlugZap className="h-8 w-8 text-critical" />
      <div>
        <p className="text-sm font-semibold text-critical">{title}</p>
        <p className="mt-1 text-xs text-muted">{message}</p>
      </div>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon = BatteryCharging,
  title = 'No battery device connected',
  message = 'Connect an ESP32 device or add a battery to start monitoring.',
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  message?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
      <Icon className="h-8 w-8 text-faint" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-sm text-xs text-muted">{message}</p>
      </div>
      {action}
    </div>
  )
}
