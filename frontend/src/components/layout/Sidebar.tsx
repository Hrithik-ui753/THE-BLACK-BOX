import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, LayoutDashboard, BarChart3, FileText, Settings, User, Plus, X, Box, Battery as BatteryIcon, Cpu, ChevronRight, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { NewAnalyticsModal } from '@/components/analytics/NewAnalyticsModal'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/status'

const NAV = [
  { to: ROUTES.landing, label: 'Landing Page', icon: Home },
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.analytics, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.reports, label: 'Reports', icon: FileText },
]

const BOTTOM = [
  { to: ROUTES.settings, label: 'Settings', icon: Settings },
  { to: ROUTES.profile, label: 'Profile', icon: User },
]

function SidebarLink({
  to,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
            : 'text-muted border border-transparent hover:bg-surface-2 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
          {isActive && !collapsed && (
            <motion.span layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
          )}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const batteries = useAppStore((s) => s.batteries)
  const removeBattery = useAppStore((s) => s.removeBattery)
  const selectedBatteryId = useAppStore((s) => s.selectedBatteryId)
  const selectBattery = useAppStore((s) => s.selectBattery)
  const [newModalOpen, setNewModalOpen] = useState(false)

  const handleSelectDevice = (batteryId: string) => {
    selectBattery(batteryId)
    onCloseMobile()
    navigate(`/battery/${batteryId}`)
  }

  const content = (
    <div className="flex h-full flex-col gap-1 py-4">
      {/* Brand Header */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.dashboard)}
        className="flex items-center gap-2.5 px-4 pb-4 text-left"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
          <Box className="h-4.5 w-4.5 text-accent" />
        </span>
        {!collapsed && (
          <span className="text-sm font-extrabold tracking-tight text-foreground">
            THE BLACK BOX
          </span>
        )}
      </button>

      {/* Add New Device Button (ChatGPT Style New Chat Button) */}
      <div className={cn('px-2.5', collapsed && 'px-2')}>
        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5 text-[13px] font-bold text-accent shadow-sm transition-all hover:bg-accent/15 hover:border-accent/50',
            collapsed && 'justify-center px-2',
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Add New Device</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="mt-3 flex flex-col gap-0.5 px-2" aria-label="Main navigation">
        {NAV.map((n) => (
          <SidebarLink key={n.to} {...n} collapsed={collapsed} onNavigate={onCloseMobile} />
        ))}
      </nav>

      {/* ChatGPT-Style Recent Devices History List */}
      {!collapsed && (
        <div className="mt-4 flex flex-1 flex-col overflow-hidden px-2">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-faint">
              <Cpu className="h-3 w-3 text-accent" /> Recent Devices ({batteries.length})
            </span>
            <button
              type="button"
              onClick={() => setNewModalOpen(true)}
              className="text-[10px] font-bold text-accent hover:underline"
            >
              + Add
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1">
            {batteries.filter(Boolean).map((b) => {
              if (!b || !b.id) return null
              const active = selectedBatteryId === b.id || location.pathname === `/battery/${b.id}`
              const statusColor =
                b.status === 'healthy'
                  ? 'bg-healthy'
                  : b.status === 'warning'
                  ? 'bg-warning'
                  : b.status === 'critical'
                  ? 'bg-critical'
                  : 'bg-faint'

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectDevice(b.id)}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left cursor-pointer transition-all',
                    active
                      ? 'border-accent/40 bg-accent/10 shadow-sm'
                      : 'border-transparent bg-surface/50 hover:border-line hover:bg-surface-2',
                  )}
                >
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted group-hover:text-foreground">
                    <BatteryIcon className="h-3.5 w-3.5" />
                    <span className={cn('absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface', statusColor)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-xs font-bold', active ? 'text-accent' : 'text-foreground')}>
                      {b.name}
                    </p>
                    <p className="truncate text-[10px] text-faint">
                      {b.type.split('·')[0].trim()} · {b.cellCount} cells
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeBattery(b.id)
                    }}
                    title="Remove pack"
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-critical transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-accent" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Nav Links */}
      <div className="mt-auto flex flex-col gap-0.5 px-2 pt-2">
        <div className={cn('mb-1 border-t border-line', collapsed ? 'mx-2' : 'mx-4')} />
        {BOTTOM.map((n) => (
          <SidebarLink key={n.to} {...n} collapsed={collapsed} onNavigate={onCloseMobile} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'relative hidden border-r border-line bg-background-2/70 transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {content}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:text-accent-soft"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={cn('transition-transform', collapsed && 'rotate-180')}>
            <path d="M6.5 1.5 3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="absolute inset-y-0 left-0 w-72 border-r border-line bg-background-2"
          >
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </motion.aside>
        </div>
      )}
      <NewAnalyticsModal open={newModalOpen} onClose={() => setNewModalOpen(false)} />
    </>
  )
}
