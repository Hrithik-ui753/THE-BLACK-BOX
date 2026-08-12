import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Home, LogIn, LogOut, Menu, Settings, User as UserIcon, UserPlus } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { NotificationPanel } from './NotificationPanel'
import { Avatar } from '@/components/ui/avatar'
import { AuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/button'
import { ROUTES, APP_NAME } from '@/constants/status'
import { cn } from '@/utils/cn'

function ConnectionPill() {
  return (
    <div
      className={cn(
        'hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium sm:flex text-healthy',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-healthy status-dot-pulse" />
      Firebase Cloud Sync · Live
    </div>
  )
}

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login')

  const logout = async () => {
    const { authService } = await import('@/services/auth/authService')
    await authService.signOut()
    useAppStore.getState().setUser(null)
    useAppStore.getState().setChatOpen(false)
    navigate(ROUTES.landing)
  }

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
    setMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-background/85 px-4 backdrop-blur-md">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="rounded-lg border border-line bg-surface p-2 text-muted md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm font-extrabold tracking-tight text-foreground">
            THE BLACK BOX
          </span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-healthy status-dot-pulse" />
            Live
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <ConnectionPill />
          <NotificationPanel />

          {/* Quick Sign In button if not logged in */}
          {!user && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => openAuth('login')} className="gap-1 text-xs">
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </Button>
              <Button size="sm" onClick={() => openAuth('signup')} className="gap-1 text-xs">
                <UserPlus className="h-3.5 w-3.5" /> Sign Up
              </Button>
            </div>
          )}

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 transition-colors hover:border-accent/30"
              >
                <Avatar name={user.name ?? 'User'} photoURL={user.photoURL} />
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-panel"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-[11px] text-muted">{user.email || user.phone}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => openAuth('login')}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-accent font-medium transition-colors hover:bg-accent/10"
                      >
                        <LogIn className="h-4 w-4" /> Switch / Sign In Account
                      </button>
                      {[
                        { label: 'Landing Page', icon: Home, to: ROUTES.landing },
                        { label: 'Profile', icon: UserIcon, to: ROUTES.profile },
                        { label: 'Settings', icon: Settings, to: ROUTES.settings },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            navigate(item.to)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                        >
                          <item.icon className="h-4 w-4" /> {item.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-critical transition-colors hover:bg-critical/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        <span className="sr-only">{APP_NAME}</span>
      </header>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </>
  )
}
