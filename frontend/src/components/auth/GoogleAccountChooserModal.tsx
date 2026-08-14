import { useState } from 'react'
import { ArrowRight, Mail, Plus, Shield, User } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { User as UserType } from '@/types'
import { uid } from '@/utils/id'

const PRESET_ACCOUNTS = [
  {
    name: 'Tadepalli Hrithik',
    email: 'tadepallihrithik@gmail.com',
    photoURL: 'https://ui-avatars.com/api/?name=Tadepalli+Hrithik&background=4285F4&color=fff',
  },
  {
    name: 'Hrithik Tadepalli',
    email: 'theblackbox822@gmail.com',
    photoURL: 'https://ui-avatars.com/api/?name=Hrithik+Tadepalli&background=34A853&color=fff',
  },
  {
    name: 'Google User',
    email: 'user@gmail.com',
    photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=EA4335&color=fff',
  },
]

export function GoogleAccountChooserModal({
  open,
  onClose,
  onSelectAccount,
}: {
  open: boolean
  onClose: () => void
  onSelectAccount: (user: UserType) => void
}) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')

  const handleSelectPreset = (acc: typeof PRESET_ACCOUNTS[0]) => {
    const finalUser: UserType = {
      id: uid('google-user'),
      name: acc.name,
      email: acc.email,
      phone: '+91 98765 43210',
      photoURL: acc.photoURL,
    }
    onSelectAccount(finalUser)
    onClose()
  }

  const handleCustomConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    const email = customEmail.trim() || 'user@gmail.com'
    const rawName = customName.trim() || (email.includes('@') ? email.split('@')[0].replace('.', ' ') : 'Google User')
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    const finalUser: UserType = {
      id: uid('google-user'),
      name: formattedName,
      email: email,
      phone: '+91 98765 43210',
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=4285F4&color=fff`,
    }

    onSelectAccount(finalUser)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Google Identity Header */}
        <div className="border-b border-line bg-background-2/80 px-6 py-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">Choose an account</h2>
          <p className="mt-0.5 text-xs text-muted">to continue to <span className="font-semibold text-foreground">THE BLACK BOX</span></p>
        </div>

        {/* Account Selection List */}
        <div className="p-6 space-y-3">
          {!showCustomInput ? (
            <>
              <div className="divide-y divide-line rounded-xl border border-line overflow-hidden bg-background-2/40">
                {PRESET_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectPreset(acc)}
                    className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-accent/10 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img src={acc.photoURL} alt={acc.name} className="h-9 w-9 rounded-full border border-line shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">{acc.name}</span>
                        <span className="block text-[11px] text-muted truncate">{acc.email}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-faint group-hover:text-accent transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-line p-3 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-foreground hover:bg-surface-2"
                >
                  <Plus className="h-4 w-4" /> Use another account
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomConfirm} className="space-y-4">
              <div>
                <Label htmlFor="g-custom-email" className="text-xs font-bold text-foreground">
                  Google Email Address
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                  <Input
                    id="g-custom-email"
                    type="email"
                    placeholder="your.email@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="pl-9 text-xs"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="g-custom-name" className="text-xs font-bold text-foreground">
                  Full Name (Optional)
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                  <Input
                    id="g-custom-name"
                    type="text"
                    placeholder="Your Full Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCustomInput(false)} className="flex-1 text-xs">
                  Back to Accounts
                </Button>
                <Button type="submit" className="flex-1 gap-2 font-semibold text-xs shadow-md">
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-line text-[10px] text-faint">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-healthy" /> Google OAuth 2.0 Identity Protocol
            </span>
            <button type="button" onClick={onClose} className="hover:text-foreground font-semibold">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
