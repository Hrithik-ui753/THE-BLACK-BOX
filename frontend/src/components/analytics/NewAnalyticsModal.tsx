import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Phone, Cpu, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { SEED_BATTERIES } from '@/constants/batteries'

export function NewAnalyticsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const setBatteries = useAppStore((s) => s.setBatteries)
  const selectBattery = useAppStore((s) => s.selectBattery)

  const [mobileNumber, setMobileNumber] = useState(user?.phone || '+91 98765 43210')
  const [busy, setBusy] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)

    // Update user mobile number if provided
    if (user) {
      setUser({
        ...user,
        phone: mobileNumber.trim() || user.phone || '+91 98765 43210',
      })
    }

    // Select 3 Individual Cells Module battery profile
    const selectedPack = SEED_BATTERIES[0] || {
      id: 'battery-01',
      userId: 'demo-user',
      name: '3 Individual Cells Module',
      type: 'Modular · 3x Individual Cells (Cell 1, Cell 2, Cell 3)',
      mode: 'individual_cells',
      cellCount: 3,
      status: 'healthy',
      createdAt: Date.now()
    }

    useAppStore.getState().completeOnboarding()
    setBatteries(SEED_BATTERIES)
    selectBattery(selectedPack.id)

    setTimeout(() => {
      setBusy(false)
      onClose()
      navigate(`/battery/${selectedPack.id}`)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-line shadow-2xl">
        <DialogHeader
          title="3 Individual Cells Configuration"
          subtitle="Configure mobile number & monitor 3 Individual Cells (Cell 1, Cell 2, Cell 3)."
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Mobile Number Input */}
          <div>
            <Label htmlFor="mobile-number" className="text-xs font-bold text-foreground">
              Mobile Number (for Gmail Security Alerts)
            </Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
              <Input
                id="mobile-number"
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* 3 Individual Cells Module Selection */}
          <div>
            <Label className="text-xs font-bold text-foreground">
              Configured Battery Setup:
            </Label>
            <div className="mt-2 flex w-full items-start gap-3 rounded-xl border border-accent bg-accent/10 p-3.5 ring-2 ring-accent/30">
              <Cpu className="h-5 w-5 text-accent mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground">3 Individual Cells Module</span>
                  <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent">
                    <CheckCircle2 className="h-3 w-3" /> Selected
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Monitors explicit Cell 1, Cell 2, Cell 3 individual voltages, cell imbalance, SOH, SOC, RUL, and anomaly metrics from real-time Firebase telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="flex-1 gap-2 font-semibold shadow-md">
              {busy ? (
                'Initializing Analytics…'
              ) : (
                <>
                  Submit & Launch Dashboard <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
