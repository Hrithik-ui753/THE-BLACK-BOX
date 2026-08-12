export type CellStatus = 'healthy' | 'warning' | 'critical'
export type BatteryStatus = 'healthy' | 'warning' | 'critical' | 'offline'
export type ConnectionState = 'connected' | 'connecting' | 'waiting' | 'interrupted'
export type ChargeState = 'charging' | 'discharging' | 'idle'
export type BatteryViewMode = '3d' | '2d'
export type Units = 'metric' | 'imperial'

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  photoURL?: string
}

export interface Battery {
  id: string
  userId: string
  name: string
  type: string
  mode?: 'integrated_3s' | 'individual_cells'
  cellCount: number
  status: BatteryStatus
  deviceId?: string
  createdAt: number
}

export interface CellTelemetry {
  index: number // 1-based
  voltage: number
  temperature: number
  soc: number
  soh: number
  current: number
  status: CellStatus
  /** deviation from pack cell average, mV */
  deviation: number
  /** 0–1 likelihood of anomaly from the model */
  risk: number
  /** 0–100 gas level; >0 renders the smoke/haze layer */
  gas: number
}

export interface PackTelemetry {
  batteryId: string
  timestamp: number
  voltage: number
  current: number
  temperature: number
  soc: number
  soh: number
  cycleCount: number
  status: BatteryStatus
  chargeState: ChargeState
  cells: CellTelemetry[]
}

export interface Anomaly {
  id: string
  batteryId: string
  cellIndex: number | null
  type: string
  severity: CellStatus
  message: string
  timestamp: number
}

export interface AIInsight {
  batteryId: string
  cellIndex: number | null
  timestamp: number
  headline: string
  explanation: string
  recommendation: string
  riskPercent: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  severity: 'healthy' | 'warning' | 'critical' | 'info'
  timestamp: number
  read: boolean
}

export type ReportType = 'health' | 'cell' | 'prediction' | 'safety'

export interface Report {
  id: string
  type: ReportType
  title: string
  date: number
  batteryId: string
  batteryName: string
  status: BatteryStatus
  findings: string[]
  metrics: Record<string, string>
  actions?: string[]
}

export interface SettingsState {
  refreshIntervalMs: number
  units: Units
  aiEnabled: boolean
  alertsEnabled: boolean
  deviceName: string
  deviceConnected: boolean
}
