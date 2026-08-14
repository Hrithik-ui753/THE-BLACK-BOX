import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/auth/authService'
import { AuthShell, GoogleButton } from './AuthShared'
import { GoogleAccountChooserModal } from '@/components/auth/GoogleAccountChooserModal'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/status'
import type { User } from '@/types'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type EmailForm = z.infer<typeof emailSchema>

export function Login() {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showChooser, setShowChooser] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const afterAuth = () => navigate(ROUTES.dashboard)

  const handleSelectGoogleAccount = (selectedUser: User) => {
    setUser(selectedUser)
    afterAuth()
  }

  const onGoogle = async () => {
    setBusy(true)
    setError('')
    try {
      const user = await authService.signInWithGoogle()
      setUser(user)
      afterAuth()
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.')
      } else {
        setError(e instanceof Error ? e.message : 'Google sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const onEmailSubmit = async ({ email }: EmailForm) => {
    setBusy(true)
    setError('')
    try {
      const user = await authService.signInWithEmail(email)
      setUser(user)
      afterAuth()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in to THE BLACK BOX" subtitle="Access live battery voltage telemetry, predictions, and cloud database.">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
        <GoogleButton onClick={() => void onGoogle()} disabled={busy} label="Sign in with Google" />

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">or continue with email & password</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="john.doe@gmail.com"
              className="mt-1.5"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-[11px] text-critical">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="login-password">Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-9"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-2.5 text-faint hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-critical">{errors.password.message}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full justify-center gap-2 font-medium" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-[11px] font-medium text-critical">
            {error}
          </p>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        New to THE BLACK BOX?{' '}
        <Link to={ROUTES.signup} className="font-semibold text-accent hover:underline">
          Sign up with Google
        </Link>
      </p>

      <GoogleAccountChooserModal
        open={showChooser}
        onClose={() => setShowChooser(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </AuthShell>
  )
}
