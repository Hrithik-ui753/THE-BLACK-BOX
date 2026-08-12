import { useState } from 'react'
import { ArrowRight, Mail, Shield, User } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import type { User as UserType } from '@/types'
import { uid } from '@/utils/id'

export function GoogleAccountChooserModal({
  open,
  onClose,
  onSelectAccount,
}: {
  open: boolean
  onClose: () => void
  onSelectAccount: (user: UserType) => void
}) {
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    const email = googleEmail.trim() || 'user@gmail.com'
    const rawName = googleName.trim() || (email.includes('@') ? email.split('@')[0].replace('.', ' ') : 'Google User')
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
        <div className="border-b border-line bg-background-2 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z" />
              <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
            </svg>
            <h2 className="text-base font-bold text-foreground">Sign in with Google</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Enter your real Google Account details to authenticate to THE BLACK BOX</p>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 p-6">
          <div>
            <Label htmlFor="g-email" className="text-xs font-bold text-foreground">
              Google Email Address
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
              <Input
                id="g-email"
                type="email"
                placeholder="your.real.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="pl-9 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="g-name" className="text-xs font-bold text-foreground">
              Full Name (as displayed on Google Account)
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
              <Input
                id="g-name"
                type="text"
                placeholder="Your Full Name"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2 font-semibold text-xs shadow-md">
              Sign In with Google Account <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-faint">
            <Shield className="h-3 w-3 text-healthy" /> Verified Google OAuth 2.0 Identity Protocol
          </div>
        </form>
      </div>
    </Dialog>
  )
}
