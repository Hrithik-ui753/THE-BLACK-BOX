import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowRight, LogIn, UserPlus, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/auth/authService'
import { GoogleButton } from '@/pages/auth/AuthShared'
import { GoogleAccountChooserModal } from '@/components/auth/GoogleAccountChooserModal'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants/status'
import type { User } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>

export function LandingAuthCard({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)

  const [tab, setTab] = useState<'login' | 'signup'>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showChooser, setShowChooser] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const afterAuth = () => {
    const isDone = useAppStore.getState().onboardingComplete
    navigate(isDone ? ROUTES.dashboard : ROUTES.onboarding)
  }

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
      if (e?.message === 'REQUIRE_ACCOUNT_CHOOSER') {
        setShowChooser(true)
      } else {
        setError(e instanceof Error ? e.message : 'Google sign-in failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const onLoginSubmit = async ({ email }: LoginForm) => {
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

  const onSignupSubmit = async ({ name, email }: SignupForm) => {
    setBusy(true)
    setError('')
    try {
      const user = await authService.signup(name, email)
      setUser(user)
      afterAuth()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Account creation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="auth-section" className={`rounded-3xl border border-line bg-white/95 p-6 shadow-xl backdrop-blur-md dark:bg-slate-900/90 ${className}`}>
      {/* Mode Switcher Tabs */}
      <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setTab('signup')
            setError('')
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            tab === 'signup'
              ? 'bg-white text-accent shadow-sm dark:bg-slate-700 dark:text-accent-foreground'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Create Account
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('login')
            setError('')
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
            tab === 'login'
              ? 'bg-white text-accent shadow-sm dark:bg-slate-700 dark:text-accent-foreground'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </button>
      </div>

      <div className="mt-5">
        <GoogleButton
          onClick={() => void onGoogle()}
          disabled={busy}
          label={tab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        />

        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-faint">
            {tab === 'signup' ? 'or register with email & password' : 'or continue with email & password'}
          </span>
          <Separator className="flex-1" />
        </div>

        {tab === 'signup' ? (
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-3.5">
            <div>
              <Label htmlFor="landing-signup-name">Full Name</Label>
              <Input
                id="landing-signup-name"
                placeholder="John Doe"
                className="mt-1"
                {...signupForm.register('name')}
              />
              {signupForm.formState.errors.name && (
                <p className="mt-1 text-[11px] text-critical">
                  {signupForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="landing-signup-email">Email Address</Label>
              <Input
                id="landing-signup-email"
                type="email"
                placeholder="john.doe@gmail.com"
                className="mt-1"
                {...signupForm.register('email')}
              />
              {signupForm.formState.errors.email && (
                <p className="mt-1 text-[11px] text-critical">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="landing-signup-password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                <Input
                  id="landing-signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...signupForm.register('password')}
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
              {signupForm.formState.errors.password && (
                <p className="mt-1 text-[11px] text-critical">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full justify-center gap-2 font-medium" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Get Started Free <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        ) : (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3.5">
            <div>
              <Label htmlFor="landing-login-email">Email Address</Label>
              <Input
                id="landing-login-email"
                type="email"
                placeholder="john.doe@gmail.com"
                className="mt-1"
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-[11px] text-critical">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="landing-login-password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                <Input
                  id="landing-login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...loginForm.register('password')}
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
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-[11px] text-critical">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full justify-center gap-2 font-medium" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
        )}

        {error && (
          <p className="mt-3.5 rounded-xl border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-[11px] font-medium text-critical">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-faint">
        <ShieldCheck className="h-3.5 w-3.5 text-healthy" />
        <span>Secure authentication · No public dashboard access without login</span>
      </div>

      <GoogleAccountChooserModal
        open={showChooser}
        onClose={() => setShowChooser(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </div>
  )
}
