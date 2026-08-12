import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative inline-flex">
    <select
      ref={ref}
      className={cn(
        'h-9 appearance-none rounded-lg border border-line bg-surface-2 pl-3 pr-8 text-xs font-medium text-foreground',
        'hover:bg-surface-3 focus-visible:border-accent/60 focus-visible:outline-none transition-colors cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
  </div>
))
Select.displayName = 'Select'
