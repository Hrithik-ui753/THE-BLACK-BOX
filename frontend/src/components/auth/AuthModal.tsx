import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Eye, EyeOff, Loader2, LogIn, Lock, Mail, ShieldCheck, User as UserIcon, UserPlus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/auth/authService'
import { GoogleButton } from '@/pages/auth/AuthShared'
import { GoogleAccountChooserModal } from '@/components/auth/GoogleAccountChooserModal'
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

export function AuthModal({
  open,
  onClose,
  initialTab = 'login',
}: {
  open: boolean
  onClose: () => void
  initialTab?: 'login' | 'signup'
}) {
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)

  const [tab, setTab] = useState<'login' | 'signup'>(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showChooser, setShowChooser] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const afterAuth = () => {
    onClose()
    navigate(ROUTES.dashboard)
  }

  const handleSelectGoogleAccount = (selectedUser: User) => {
    setUser(selectedUser)
    afterAuth()
  }

  const onGoogle = async (isSignup = false) => {
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
        setError(e instanceof Error ? e.message : `${isSignup ? 'Google sign-up' : 'Google sign-in'} failed`)
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
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl backdrop-blur-xl sm:max-w-md w-full">
          {/* Header Banner */}
          <div className="border-b border-line bg-background-2/80 px-6 py-5">
            <h2 className="text-lg font-black text-foreground">
              {tab === 'login' ? 'Sign In to THE BLACK BOX' : 'Create THE BLACK BOX Account'}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {tab === 'login'
                ? 'Access live battery voltage telemetry, predictions, and cloud database.'
                : 'Start monitoring battery telemetry and cloud intelligence in minutes.'}
            </p>
          </div>

          <div className="p-6">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center rounded-xl bg-surface-2 p-1 border border-line">
              <button
                type="button"
                onClick={() => {
                  setTab('login')
                  setError('')
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  tab === 'login'
                    ? 'bg-background text-accent shadow-sm border border-line'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup')
                  setError('')
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                  tab === 'signup'
                    ? 'bg-background text-accent shadow-sm border border-line'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Sign Up
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {/* Google Actions */}
              <GoogleButton
                onClick={() => void onGoogle(tab === 'signup')}
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

              {tab === 'login' ? (
                /* Login Form */
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="auth-modal-login-email" className="text-xs font-semibold">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                      <Input
                        id="auth-modal-login-email"
                        type="email"
                        placeholder="john.doe@gmail.com"
                        className="pl-9 text-xs"
                        {...loginForm.register('email')}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="mt-1 text-[11px] text-critical">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="auth-modal-login-password" className="text-xs font-semibold">Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                      <Input
                        id="auth-modal-login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9 pr-9 text-xs"
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
                      <p className="mt-1 text-[11px] text-critical">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full justify-center gap-2 font-medium" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
              ) : (
                /* Signup Form */
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="auth-modal-signup-name" className="text-xs font-semibold">Full Name</Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                      <Input
                        id="auth-modal-signup-name"
                        placeholder="John Doe"
                        className="pl-9 text-xs"
                        {...signupForm.register('name')}
                      />
                    </div>
                    {signupForm.formState.errors.name && (
                      <p className="mt-1 text-[11px] text-critical">{signupForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="auth-modal-signup-email" className="text-xs font-semibold">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                      <Input
                        id="auth-modal-signup-email"
                        type="email"
                        placeholder="john.doe@gmail.com"
                        className="pl-9 text-xs"
                        {...signupForm.register('email')}
                      />
                    </div>
                    {signupForm.formState.errors.email && (
                      <p className="mt-1 text-[11px] text-critical">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="auth-modal-signup-password" className="text-xs font-semibold">Create Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-faint" />
                      <Input
                        id="auth-modal-signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9 pr-9 text-xs"
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
                      <p className="mt-1 text-[11px] text-critical">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full justify-center gap-2 font-medium" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
              )}

              {error && (
                <p className="mt-3.5 rounded-xl border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-[11px] font-medium text-critical">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-faint">
              <ShieldCheck className="h-3.5 w-3.5 text-healthy" />
              <span>Firebase Auth & Supabase Cloud Protected</span>
            </div>
          </div>
        </div>
      </Dialog>

      <GoogleAccountChooserModal
        open={showChooser}
        onClose={() => setShowChooser(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </>
  )
}
