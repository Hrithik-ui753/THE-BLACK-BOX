import { motion } from 'framer-motion'
import { Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/status'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background-2 px-4 py-8">
      <div className="grid-bg pointer-events-none fixed inset-0" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 shadow-sm">
            <Box className="h-6 w-6 text-accent" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{APP_NAME}</h1>
          <p className="text-sm font-semibold text-accent">{title}</p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
        {children}
        <p className="mt-6 text-center text-[11px] text-faint">
          Secure OAuth 2.0 Auth · Direct session entry
        </p>
      </motion.div>
    </div>
  )
}

export function GoogleButton({ onClick, label = 'Continue with Google', disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <Button variant="outline" size="lg" className="w-full justify-center gap-2 font-medium shadow-sm hover:border-accent/40" onClick={onClick} disabled={disabled}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77z" />
      </svg>
      {label}
    </Button>
  )
}
