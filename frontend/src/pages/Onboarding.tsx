import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Box, ChevronRight, Phone, Cpu } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { APP_NAME, ROUTES } from '@/constants/status'
import { SEED_BATTERIES } from '@/constants/batteries'

export function Onboarding() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const setBatteries = useAppStore((s) => s.setBatteries)
  const selectBattery = useAppStore((s) => s.selectBattery)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const navigate = useNavigate()

  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210')

  const continueFlow = () => {
    // Update user profile with phone number
    if (user) {
      setUser({
        ...user,
        phone: phone.trim() || user.phone || '+91 98765 43210',
      })
    }

    setBatteries(SEED_BATTERIES)
    selectBattery(SEED_BATTERIES[0]?.id || 'battery-02')
    completeOnboarding()
    navigate(ROUTES.dashboard)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background-2 px-4 py-8">
      <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-lg"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 shadow-sm">
            <Box className="h-6 w-6 text-accent" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            Configure 3 Individual Cells Hardware
          </h1>
          <p className="text-xs text-muted">
            {APP_NAME} will stream live real-time individual cell telemetry (Cell 1, Cell 2, Cell 3) to Firebase.
          </p>
        </div>

        <Card className="border border-line bg-surface shadow-panel">
          <CardContent className="p-6">
            {/* User Profile Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-line bg-slate-50 px-4 py-3">
              <Avatar name={user?.name ?? 'User'} photoURL={user?.photoURL} className="h-9 w-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{user?.name || 'Authenticated User'}</p>
                <p className="truncate text-[11px] text-muted">{user?.email || 'Connected Account'}</p>
              </div>
            </div>

            {/* Indian Mobile Number Input */}
            <div className="mt-5">
              <Label htmlFor="ob-phone" className="text-xs font-bold text-foreground">
                Indian Mobile Number (for Alert Routing & SMS/Email Alerts)
              </Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                <Input
                  id="ob-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            {/* Hardware Configuration Banner */}
            <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-foreground">
                  <Cpu className="h-4 w-4 text-accent" /> 3 Individual Cells Hardware Module
                </span>
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[9px] font-extrabold text-accent">
                  Live Firebase Stream
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted leading-relaxed">
                Streams explicit Cell 1 (4.12 V), Cell 2 (3.65 V), Cell 3 (4.10 V) individual voltages, cell balance, animations, and sum-to-pack triggers directly to Firebase Realtime Database.
              </p>
            </div>

            <Button className="mt-6 w-full justify-center gap-2 font-bold shadow-md" size="lg" onClick={continueFlow}>
              Submit & View 3 Individual Cells Results <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
