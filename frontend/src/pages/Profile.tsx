import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, LogOut, Mail, Phone, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ROUTES } from '@/constants/status'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})

type ProfileForm = z.infer<typeof profileSchema>

export function Profile() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const onSave = (values: ProfileForm) => {
    if (user) {
      setUser({ ...user, name: values.name, email: values.email || undefined })
      setEditMessage('Profile updated.')
      setTimeout(() => setEditMessage(''), 2500)
    }
    setEditing(false)
  }

  const logout = async () => {
    const { authService } = await import('@/services/auth/authService')
    await authService.signOut()
    setUser(null)
    navigate(ROUTES.landing)
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Profile</h1>
      <p className="mt-1 text-sm text-muted">Manage your account and preferences.</p>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar name={user.name} photoURL={user.photoURL} className="h-20 w-20 text-lg" />
            <button
              type="button"
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-accent-soft"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
            <p className="text-xs text-muted">{user.email ?? 'No email set'}</p>
            <p className="mt-0.5 text-xs text-muted">{user.phone}</p>
          </div>
          <div className="sm:ml-auto">
            <Button variant="outline" onClick={() => { reset({ name: user.name, email: user.email ?? '' }); setEditing(true) }}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-accent" /> Account information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px]">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-faint" />
              <span className="text-muted">Email</span>
              <span className="ml-auto font-medium text-foreground">{user.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-faint" />
              <span className="text-muted">Phone</span>
              <span className="ml-auto font-medium tabular-nums text-foreground">{user.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-faint" />
              <span className="text-muted">Verification</span>
              <span className="ml-auto">
                <span className="rounded-full border border-healthy/30 bg-healthy/10 px-2 py-0.5 text-[10px] font-semibold text-healthy">
                  Verified
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">Two-factor auth</p>
                <p className="text-xs text-muted">Phone OTP is enabled</p>
              </div>
              <Switch checked aria-label="Two-factor authentication" onCheckedChange={() => undefined} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">Sessions</p>
                <p className="text-xs text-muted">1 active session</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => undefined}>Sign out other devices</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Email digests and alert routing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-foreground">Critical alerts</p>
            <Switch checked aria-label="Critical alerts" onCheckedChange={() => undefined} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-foreground">Weekly health summary</p>
            <Switch checked={false} aria-label="Weekly health summary" onCheckedChange={() => undefined} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="destructive" onClick={logout}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
      {editMessage && <p className="mt-3 text-xs text-healthy">{editMessage}</p>}

      <Dialog open={editing} onOpenChange={(o) => !o && setEditing(false)}>
        <div>
          <DialogHeader title="Edit profile" subtitle="Update your account details" onClose={() => setEditing(false)} />
          <form onSubmit={handleSubmit(onSave)} className="space-y-4 px-5 py-5">
            <div>
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" className="mt-1.5" {...register('name')} />
              {errors.name && <p className="mt-1 text-[11px] text-critical">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" type="email" className="mt-1.5" placeholder="you@company.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-[11px] text-critical">{errors.email.message}</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" className="flex-1">Save changes</Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  )
}
