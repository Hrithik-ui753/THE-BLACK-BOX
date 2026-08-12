import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/utils/cn'
import { fmtTime } from '@/utils/format'

const severityColor = {
  healthy: 'bg-healthy',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-accent',
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifications = useAppStore((s) => s.notifications)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Notifications</p>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-accent-soft"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted">No notifications yet.</p>
              ) : (
                notifications.slice(0, 12).map((n) => (
                  <div key={n.id} className={cn('flex gap-3 border-b border-line/60 px-4 py-3', !n.read && 'bg-accent/[0.04]')}>
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', severityColor[n.severity])} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{n.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{n.body}</p>
                      <p className="mt-1 text-[10px] text-faint">{fmtTime(n.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
