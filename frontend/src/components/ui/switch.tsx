import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function Switch({ checked, onCheckedChange, disabled, className, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full border transition-colors',
        checked ? 'border-accent/50 bg-accent/25' : 'border-line bg-surface-2',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={cn(
          'absolute h-4 w-4 rounded-full shadow-sm',
          checked ? 'left-[calc(100%-1.125rem)] bg-accent' : 'left-0.5 bg-muted',
        )}
      />
    </button>
  )
}
