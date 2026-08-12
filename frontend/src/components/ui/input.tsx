import * as React from 'react'
import { cn } from '@/utils/cn'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-line bg-background-2 px-3 py-2 text-sm text-foreground',
        'placeholder:text-faint focus-visible:border-accent/60 focus-visible:outline-none transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-medium text-muted select-none', className)}
      {...props}
    />
  )
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-line bg-background-2 px-3 py-2 text-sm text-foreground',
        'placeholder:text-faint focus-visible:border-accent/60 focus-visible:outline-none transition-colors',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
