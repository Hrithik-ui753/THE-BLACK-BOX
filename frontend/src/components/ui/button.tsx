import * as React from 'react'
import { cn } from '@/utils/cn'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'healthy'
type Size = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm'

const variantClasses: Record<Variant, string> = {
  default:
    'bg-accent text-background font-semibold hover:bg-accent-soft hover:shadow-glow-cyan transition-[background,box-shadow]',
  secondary: 'bg-surface-2 text-foreground hover:bg-surface-3 transition-colors',
  outline: 'border border-line bg-transparent text-foreground hover:bg-surface-2 hover:border-accent/40 transition-colors',
  ghost: 'text-muted hover:text-foreground hover:bg-surface-2 transition-colors',
  destructive: 'bg-critical/15 text-critical border border-critical/30 hover:bg-critical/25 transition-colors',
  healthy: 'bg-healthy/15 text-healthy border border-healthy/30 hover:bg-healthy/25 transition-colors',
}

const sizeClasses: Record<Size, string> = {
  default: 'h-9 px-4 text-sm rounded-lg',
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-11 px-6 text-sm rounded-lg',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-md',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
        'disabled:pointer-events-none disabled:opacity-50 select-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
