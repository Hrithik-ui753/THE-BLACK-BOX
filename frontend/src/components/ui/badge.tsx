import * as React from 'react'
import { cn } from '@/utils/cn'

export type BadgeVariant = 'healthy' | 'warning' | 'critical' | 'accent' | 'outline' | 'muted' | 'offline'

const styles: Record<BadgeVariant, string> = {
  healthy: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30 font-bold',
  warning: 'bg-amber-500/15 text-amber-900 border-amber-500/40 font-bold',
  critical: 'bg-rose-500/15 text-rose-900 border-rose-500/40 font-bold',
  accent: 'bg-orange-500/15 text-orange-900 border-orange-500/40 font-bold',
  outline: 'text-foreground border-line font-bold',
  muted: 'bg-surface-2 text-foreground border-line font-bold',
  offline: 'bg-slate-500/15 text-slate-800 border-slate-500/30 font-bold',
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
