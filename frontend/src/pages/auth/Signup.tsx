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

const signupSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignupForm = z.infer<typeof signupSchema>

export function Signup() {
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
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const handleSelectGoogleAccount = (selectedUser: User) => {
    setUser(selectedUser)
    navigate(ROUTES.dashboard)
  }

  const onGoogle = async () => {
    setBusy(true)
    setError('')
    try {
      const user = await authService.signInWithGoogle()
      setUser(user)
      navigate(ROUTES.dashboard)
    } catch (e: any) {
      if (e?.message === 'REQUIRE_ACCOUNT_CHOOSER') {
        setShowChooser(true)
      } else {
        setError(e instanceof Error ? e.message : 'Google sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const onFormSubmit = async ({ name, email }: SignupForm) => {
    setBusy(true)
    setError('')
    try {
      const user = await authService.signup(name, email)
      setUser(user)
      navigate(ROUTES.dashboard)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Account creation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create your THE BLACK BOX account" subtitle="Start monitoring battery voltage telemetry and cloud intelligence in minutes.">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-panel">
        <GoogleButton onClick={() => void onGoogle()} disabled={busy} label="Sign up with Google" />

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">or register with email & password</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="signup-name">Full Name</Label>
            <Input id="signup-name" placeholder="John Doe" className="mt-1.5" {...register('name')} />
            {errors.name && <p className="mt-1 text-[11px] text-critical">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="signup-email">Email Address</Label>
            <Input id="signup-email" type="email" placeholder="john.doe@gmail.com" className="mt-1.5" {...register('email')} />
            {errors.email && <p className="mt-1 text-[11px] text-critical">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="signup-password">Create Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="signup-password"
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
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-[11px] font-medium text-critical">
            {error}
          </p>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link to={ROUTES.login} className="font-semibold text-accent hover:underline">
          Sign in
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
