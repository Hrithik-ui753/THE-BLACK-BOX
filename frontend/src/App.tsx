import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/states/States'
import { ErrorBoundary } from '@/components/states/ErrorBoundary'
import { ROUTES } from '@/constants/status'

// Pages are lazy-loaded so heavy deps (echarts, three, plotly) never block
// the initial paint of the app.
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('@/pages/auth/Login').then((m) => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/auth/Signup').then((m) => ({ default: m.Signup })))
const Onboarding = lazy(() => import('@/pages/Onboarding').then((m) => ({ default: m.Onboarding })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const BatteryDetail = lazy(() => import('@/pages/BatteryDetail').then((m) => ({ default: m.BatteryDetail })))
const Analytics = lazy(() => import('@/pages/Analytics').then((m) => ({ default: m.Analytics })))
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })))
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingState message="Loading…" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user)
  const location = useLocation()
  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
  }
  return children
}

function RequireSetup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<Lazy><Landing /></Lazy>} />
      <Route path={ROUTES.login} element={<Lazy><Login /></Lazy>} />
      <Route path={ROUTES.signup} element={<Lazy><Signup /></Lazy>} />
      <Route
        path={ROUTES.onboarding}
        element={
          <RequireAuth>
            <Lazy><Onboarding /></Lazy>
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireSetup>
              <AppShell />
            </RequireSetup>
          </RequireAuth>
        }
      >
        <Route path={ROUTES.dashboard} element={<Lazy><Dashboard /></Lazy>} />
        <Route path="/battery/:batteryId" element={<Lazy><BatteryDetail /></Lazy>} />
        <Route path={ROUTES.analytics} element={<Lazy><Analytics /></Lazy>} />
        <Route path={ROUTES.reports} element={<Lazy><Reports /></Lazy>} />
        <Route path={ROUTES.settings} element={<Lazy><Settings /></Lazy>} />
        <Route path={ROUTES.profile} element={<Lazy><Profile /></Lazy>} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  )
}
