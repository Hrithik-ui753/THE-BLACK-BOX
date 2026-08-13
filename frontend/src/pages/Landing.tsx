import { useEffect, Suspense, lazy } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, BrainCircuit, Gauge, Radar, ShieldCheck, Box, Zap } from 'lucide-react'
import { usePack } from '@/hooks/usePack'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/states/States'
import { APP_NAME, APP_TAGLINE, ROUTES } from '@/constants/status'
import { SEED_BATTERIES } from '@/constants/batteries'

const BatteryPack3D = lazy(() => import('@/components/battery/BatteryPack3D'))

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-Time Voltage Telemetry',
    body: 'Live high-frequency telemetry from every cell — voltage, temperature, current, and SOH streamed directly from cloud database.',
  },
  {
    icon: BrainCircuit,
    title: 'AI Battery Health & RUL',
    body: 'Predictive machine learning models track degradation, project Remaining Useful Life (RUL), and flag early anomalies.',
  },
  {
    icon: Radar,
    title: 'Multi-Cell 2D & 3D Diagnostics',
    body: 'Inspect individual cell voltages with interactive 2D heatmaps and full 3D pack view with custom status color indicators.',
  },
  {
    icon: Gauge,
    title: 'Predictive Analytics Engine',
    body: 'Voltage divergence analysis, thermal run-away prevention, and continuous cloud database synchronization.',
  },
]

export function Landing() {
  const navigate = useNavigate()
  const pack = usePack('battery-01')
  const battery = SEED_BATTERIES[0]

  useEffect(() => {
    void import('@/services/telemetry/telemetryService').then(({ telemetryService }) => {
      telemetryService.start()
      return () => telemetryService.stop()
    })
  }, [])

  return (
    <div className="min-h-dvh bg-background-2 text-foreground">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 shadow-sm">
              <Box className="h-5 w-5 text-accent" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-foreground">
              THE BLACK BOX
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-muted sm:flex">
            <a href="#product" className="transition-colors hover:text-foreground">3D Voltage Model</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#auth-section" className="transition-colors hover:text-foreground">Account Access</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.login)}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.signup)} className="gap-1.5 font-medium">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section id="product" className="relative overflow-hidden py-10 sm:py-16">
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <Badge variant="accent" className="mb-4 gap-1.5 px-3 py-1 text-xs w-fit">
              <span className="h-2 w-2 rounded-full bg-accent status-dot-pulse" />
              Live 3D Battery Simulation & Cloud Telemetry
            </Badge>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {APP_NAME}
            </h1>
            <p className="mt-3 text-lg font-semibold text-accent">{APP_TAGLINE}</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
              Interactive 3D battery Pack visualization with real-time cell voltage telemetry, cloud database synchronization, and predictive health analytics.
            </p>
            
            {/* App Overview & Feature Showcase Grid */}
            <div className="mt-6 space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent font-black text-xs">
                      ⚡
                    </span>
                    <h3 className="text-sm font-extrabold text-foreground">3-Cell Telemetry</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Real-time individual cell voltage monitoring (Cell 1, Cell 2, Cell 3) with live balance tracking.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-healthy/10 text-healthy font-black text-xs">
                      🧠
                    </span>
                    <h3 className="text-sm font-extrabold text-foreground">AI Safety Pipeline</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Azure OpenAI diagnostic reasoning engine for root-cause safety analysis and anomaly isolation.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10 text-warning font-black text-xs">
                      🔥
                    </span>
                    <h3 className="text-sm font-extrabold text-foreground">Thermal Risk Model</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Predictive thermal runaway hazard index, ambient temperature correlation, and degradation forecasting.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 hover:shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 font-black text-xs">
                      📊
                    </span>
                    <h3 className="text-sm font-extrabold text-foreground">Cloud Database Sync</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Continuous Supabase database persistence, smart alert tracking, and automated email notifications.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate(ROUTES.login)}
                  className="gap-2 font-extrabold text-sm shadow-md"
                >
                  Sign In to Access Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(ROUTES.signup)}
                  className="font-bold text-sm"
                >
                  Create Account
                </Button>
              </div>
            </div>

            {/* Live Voltage HUD strip */}
            <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white/90 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-healthy/10 text-healthy">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Pack Voltage</p>
                  <p className="text-base font-extrabold tabular-nums text-foreground">
                    {pack ? `${pack.voltage.toFixed(2)} V` : '22.58 V'}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-line" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-faint">State of Charge</p>
                <p className="text-base font-extrabold tabular-nums text-accent">
                  {pack?.soc !== null && pack?.soc !== undefined ? `${pack.soc.toFixed(1)}%` : '98.5%'}
                </p>
              </div>

              <div className="h-8 w-px bg-line" />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-faint">State of Health</p>
                <p className="text-base font-extrabold tabular-nums text-healthy">
                  {pack?.soh !== null && pack?.soh !== undefined ? `${pack.soh.toFixed(1)}%` : '98.4%'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 3D Animation Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative h-[480px] rounded-3xl border border-line bg-white p-2 shadow-panel lg:sticky lg:top-24"
          >
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <div className="grid-bg absolute inset-0 opacity-40" aria-hidden="true" />
              
              <Suspense fallback={<LoadingState message="Loading 3D Battery Model..." />}>
                <BatteryPack3D battery={battery} />
              </Suspense>

              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-healthy status-dot-pulse" />
                3D Interactive Battery Pack
              </div>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-medium text-slate-600 shadow-md backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-healthy" />
                <span>Drag to rotate 3D pack · Scroll to zoom</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Engineered for Lithium Intelligence</h2>
          <p className="mt-2 text-sm text-muted">Complete hardware-to-cloud telemetry and multi-color cell visualizer.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-accent/30"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                <f.icon className="h-5 w-5 text-accent" />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-faint sm:flex-row sm:px-6">
          <span className="font-medium">© {new Date().getFullYear()} THE BLACK BOX — Intelligent Battery Telemetry & Diagnostics</span>
          <span className="flex items-center gap-4">
            <Link to={ROUTES.login} className="font-medium transition-colors hover:text-foreground">Sign in</Link>
            <span>Cloud Database Sync Ready</span>
          </span>
        </div>
      </footer>
    </div>
  )
}


