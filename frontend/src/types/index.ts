export type CellStatus = 'healthy' | 'warning' | 'critical' | 'CELL_REMOVED'
export type BatteryStatus = 'healthy' | 'warning' | 'critical' | 'offline' | 'CELL_MISSING'
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
  soc: number | null
  soh: number | null
  current: number
  status: CellStatus
  /** deviation from pack cell average, mV */
  deviation: number
  /** 0–1 likelihood of anomaly from the model */
  risk: number
  /** 0–100 gas level; >0 renders the smoke/haze layer */
  gas: number
  mlSkipped?: boolean
}

export interface PackTelemetry {
  batteryId: string
  timestamp: number
  voltage: number
  current: number
  temperature: number
  soc: number | null
  soh: number | null
  cycleCount: number
  status: BatteryStatus
  chargeState: ChargeState
  cells: CellTelemetry[]
  presentCells?: string
  packPresenceStatus?: string
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

export type MetricSource = 'MEASURED' | 'CALCULATED' | 'ML PREDICTED' | 'RULE-BASED' | 'AI GENERATED' | 'UNAVAILABLE'

export interface ModelMetadataItem {
  name: string
  algorithm: string
  target: string
  source: string
  version: string
  features?: string[]
  validation_metric?: string
}

export interface DiagnosticReport {
  reportId: string
  batteryId: string
  batteryName?: string
  date: number
  status: BatteryStatus
  isValid: boolean
  validationMessage?: string
  predictionSource: string
  mlPredictions: {
    soc: { value: number | null; formatted: string; label: string; sourceTag: MetricSource }
    soh: { value: number | null; formatted: string; label: string; sourceTag: MetricSource }
    rul: { value: number | null; formatted: string; available: boolean; statusNote: string; label: string; sourceTag: MetricSource }
    anomaly: { value: string; formatted: string; sourceType: string; label: string; sourceTag: MetricSource }
  }
  measuredTelemetry: {
    cell1Voltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    cell2Voltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    cell3Voltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    temperature: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    cycleCount: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    packVoltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    timestamp: { value: string; formatted: string; label: string; sourceTag: MetricSource }
  }
  calculatedMetrics: {
    minCellVoltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    maxCellVoltage: { value: number; formatted: string; label: string; sourceTag: MetricSource }
    averageCellVoltage: { value: number; formatted: string; label: string; sourceTag: MetricSource; formula?: string }
    cellVoltageSpread: { value: number; formatted: string; label: string; sourceTag: MetricSource; formula?: string }
  }
  aiExplanation: {
    executiveSummary: string
    aiExplanation: { text: string; sourceTag: MetricSource; engine: string }
    ruleBasedRecommendation: { actions: string[]; sourceTag: MetricSource; engine: string }
  }
  modelMetadata: Record<string, ModelMetadataItem>
}

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
  diagnosticData?: DiagnosticReport
}

export interface SettingsState {
  refreshIntervalMs: number
  units: Units
  aiEnabled: boolean
  alertsEnabled: boolean
  deviceName: string
  deviceConnected: boolean
}
