import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { FloatingAIButton, AIChatPanel } from '@/components/ai/AIChat'
import { useAppStore } from '@/store/useAppStore'

export function AppShell() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Start the telemetry stream once the shell mounts; stop on unmount.
  useEffect(() => {
    void import('@/services/telemetry/telemetryService').then(({ telemetryService }) => {
      telemetryService.start()
      return () => telemetryService.stop()
    })
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="relative flex-1 overflow-y-auto">
          <Outlet />
          <FloatingAIButton />
          <AIChatPanel />
        </main>
      </div>
    </div>
  )
}
