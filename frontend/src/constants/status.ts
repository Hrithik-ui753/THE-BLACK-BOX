import type { BatteryStatus, CellStatus } from '@/types'

export const STATUS_COLOR: Record<CellStatus, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  CELL_REMOVED: '#f59e0b',
}

export const BATTERY_STATUS_COLOR: Record<BatteryStatus, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  offline: '#64748b',
  CELL_MISSING: '#f59e0b',
}

export const STATUS_LABEL: Record<BatteryStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  offline: 'Offline',
  CELL_MISSING: 'Cell Missing',
}

export const CELL_STATUS_LABEL: Record<CellStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  CELL_REMOVED: 'Cell Removed',
}

export const ROUTES = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  onboarding: '/onboarding',
  dashboard: '/dashboard',
  battery: (id: string) => `/battery/${id}`,
  analytics: '/analytics',
  reports: '/reports',
  settings: '/settings',
  profile: '/profile',
} as const

export const APP_NAME = 'THE BLACK BOX'
export const APP_TAGLINE = 'Intelligent Battery Telemetry & Predictive Analytics'
