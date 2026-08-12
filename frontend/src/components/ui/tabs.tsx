import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface TabsCtx {
  value: string
  setValue: (v: string) => void
  id: string
}
const TabsContext = React.createContext<TabsCtx | null>(null)

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
  id,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  className?: string
  id?: string
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? value ?? '')
  const current = value ?? internal
  const ctxId = React.useId()
  const setValue = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue, id: id ?? ctxId }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface/80 p-1 overflow-x-auto scrollbar-none',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsTrigger outside Tabs')
  const active = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
        active ? 'text-foreground' : 'text-muted hover:text-foreground',
        className,
      )}
    >
      {active && (
        <motion.span
          layoutId={`tab-${ctx.id}`}
          className="absolute inset-0 rounded-lg bg-surface-3 border border-line"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('TabsContent outside Tabs')
  if (ctx.value !== value) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn('mt-4', className)}
    >
      {children}
    </motion.div>
  )
}
