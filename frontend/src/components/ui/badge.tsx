import * as React from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant = 'healthy' | 'warning' | 'critical' | 'accent' | 'outline' | 'muted' | 'offline'

const styles: Record<BadgeVariant, string> = {
  healthy: 'bg-healthy/12 text-healthy border-healthy/30',
  warning: 'bg-warning/12 text-warning border-warning/30',
  critical: 'bg-critical/12 text-critical border-critical/30',
  accent: 'bg-accent/12 text-accent-soft border-accent/30',
  outline: 'text-muted border-line',
  muted: 'bg-surface-2 text-muted border-line',
  offline: 'bg-faint/10 text-faint border-faint/30',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'outline', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}
