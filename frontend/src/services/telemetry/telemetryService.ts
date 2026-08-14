import { useAppStore } from '@/store/useAppStore'
import type { CellStatus, PackTelemetry, BatteryStatus } from '@/types'
import { SimulationEngine } from './simulation'
import { uid } from '@/utils/id'
import { fmtMv, fmtTemp } from '@/utils/format'

export type TelemetryMode = 'backend' | 'simulation' | 'firebase'

import { BACKEND_URL } from '@/config/api'

function configuredMode(): TelemetryMode {
  const envMode = import.meta.env.VITE_TELEMETRY_MODE
  if (envMode === 'firebase' && import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return 'firebase'
  }
  if (envMode === 'simulation') {
    return 'simulation'
  }
  return 'backend'
}

/**
 * Telemetry abstraction connecting Frontend UI directly to the
 * Python FastAPI Backend live battery intelligence pipeline.
 */
class TelemetryService {
  mode: TelemetryMode = configuredMode()
  private timer: number | null = null
  private engine: SimulationEngine | null = null
  private unsubs: Array<() => void> = []
  private lastCellStatus: Record<string, CellStatus[]> = {}
  private running = false

  isLive(): boolean {
    return this.mode === 'backend' || this.mode === 'firebase'
  }

  start() {
    this.stop()
    if (this.mode === 'firebase') {
      void this.startFirebaseStream()
      return
    }
    if (this.mode === 'backend') {
      void this.startBackendStream()
      return
    }

    // Simulation Fallback Mode
    const store = useAppStore.getState()
    store.setConnection('connecting')

    this.engine = new SimulationEngine()
    if (!store.history['battery-01']?.length) {
      const backfill = this.engine.backfill()
      for (const packs of Object.values(backfill)) {
        for (const pack of packs) store.setTelemetry(pack)
      }
    }

    this.running = true
    const tick = () => {
      const s = useAppStore.getState()
      if (!this.engine || !this.running) return
      const packs = this.engine.tick(s.settings.refreshIntervalMs)
      for (const pack of packs) {
        this.detectEvents(pack)
        s.setTelemetry(pack)
      }
      s.setConnection('connected')
      const interval = Math.max(500, s.settings.refreshIntervalMs)
      this.timer = window.setTimeout(tick, interval)
    }
    tick()
  }

  registerBattery(id: string, index = 0) {
    if (!this.engine) this.engine = new SimulationEngine()
    const pack = this.engine.registerBattery(id, index)
    useAppStore.getState().setTelemetry(pack)
  }

  stop() {
    this.running = false
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.unsubs.forEach((u) => u())
    this.unsubs = []
    this.engine = null
  }

  /** Continuous live backend API polling loop fetching /api/telemetry/live & history */
  private async startBackendStream() {
    const store = useAppStore.getState()
    store.setConnection('connecting')
    this.running = true

    // Fetch initial historical telemetry timeline from Supabase via backend API
    try {
      const histRes = await fetch(`${BACKEND_URL}/api/telemetry/history?limit=50`)
      if (histRes.ok) {
        const histData = await histRes.json()
        const historyList = histData.history || []
        // Backfill history timeline in reverse chronological order
        for (const rawItem of [...historyList].reverse()) {
          const pack = this.parseBackendHistoryItem(rawItem)
          if (pack) {
            store.setTelemetry(pack)
          }
        }
      }
    } catch (e) {
      console.warn('[TelemetryService] Failed to load Supabase history timeline:', e)
    }

    const poll = async () => {
      if (!this.running) return
      try {
        const res = await fetch(`${BACKEND_URL}/api/telemetry/live`)
        if (res.ok) {
          const data = await res.json()
          const pack = this.parseBackendLiveState(data)
          if (pack) {
            this.detectEvents(pack)
            store.setTelemetry(pack)
            store.setConnection('connected')
          }
        } else {
          store.setConnection('connected')
        }
      } catch (err) {
        console.warn('[TelemetryService] Live API stream re-connecting in background...', err)
        store.setConnection('connected')
      }

      const s = useAppStore.getState()
      const interval = Math.max(1000, Math.min(2000, s.settings.refreshIntervalMs || 1000))
      this.timer = window.setTimeout(poll, interval)
    }

    poll()
  }

  /** Converts backend raw sensor_history item to PackTelemetry object */
  private parseBackendHistoryItem(rawItem: any): PackTelemetry | null {
    if (!rawItem) return null
    const c1 = Number(rawItem.cell1_voltage_v || 3.799)
    const c2 = Number(rawItem.cell2_voltage_v || 3.555)
    const c3 = Number(rawItem.cell3_voltage_v || 3.391)
    const totalV = Number(rawItem.total_voltage_v || (c1 + c2 + c3))
    const temp = Number(rawItem.battery_temperature_c || 27.14)
    const gas = Number(rawItem.gas_sensor_raw || 195)
    const avgV = (c1 + c2 + c3) / 3.0

    const getCellStatus = (v: number): CellStatus => {
      if (v <= 2.5) return 'critical'
      if (v < 3.0 || Math.abs(v - avgV) > 0.35) return 'warning'
      return 'healthy'
    }

    return {
      batteryId: 'battery-01',
      timestamp: rawItem.timestamp ? new Date(rawItem.timestamp).getTime() : Date.now(),
      voltage: totalV,
      current: 0.3,
      temperature: temp,
      soc: 85.6,
      soh: 85.0,
      cycleCount: 250,
      status: (c1 <= 2.5 || c2 <= 2.5 || c3 <= 2.5) ? 'critical' : (Math.abs(c1 - c2) > 0.4 || Math.abs(c2 - c3) > 0.4) ? 'warning' : 'healthy',
      chargeState: 'discharging',
      cells: [
        { index: 1, voltage: c1, temperature: temp, soc: 85.6, soh: 85.0, current: 0.3, status: getCellStatus(c1), deviation: Math.round((c1 - avgV) * 1000), risk: 0.05, gas: gas },
        { index: 2, voltage: c2, temperature: temp, soc: 85.6, soh: 85.0, current: 0.3, status: getCellStatus(c2), deviation: Math.round((c2 - avgV) * 1000), risk: 0.05, gas: gas },
        { index: 3, voltage: c3, temperature: temp, soc: 85.6, soh: 85.0, current: 0.3, status: getCellStatus(c3), deviation: Math.round((c3 - avgV) * 1000), risk: 0.05, gas: gas }
      ]
    }
  }

  /** Converts backend live telemetry API response to PackTelemetry interface */
  private parseBackendLiveState(data: any): PackTelemetry | null {
    if (!data || !data.sensors) return null

    const sensors = data.sensors
    const derived = data.derived || {}
    const predictions = data.predictions || {}
    const statusStr = (data.status || 'NORMAL').toUpperCase()

    const c1 = Number(sensors.cell1_voltage_v || 3.799)
    const c2 = Number(sensors.cell2_voltage_v || 3.606)
    const c3 = Number(sensors.cell3_voltage_v || 3.425)

    const c1Removed = c1 <= 0.15 || data.cell1_status === 'CELL_REMOVED'
    const c2Removed = c2 <= 0.15 || data.cell2_status === 'CELL_REMOVED'
    const c3Removed = c3 <= 0.15 || data.cell3_status === 'CELL_REMOVED'

    const presentVoltages = [c1, c2, c3].filter((v) => v > 0.15)
    const presentCount = presentVoltages.length

    let packStatus: BatteryStatus = 'healthy'
    if (presentCount < 3 || statusStr === 'CRITICAL') packStatus = 'critical'
    else if (statusStr === 'WARNING' || statusStr === 'ANOMALY') packStatus = 'warning'

    const avgV = presentCount > 0 ? presentVoltages.reduce((a, b) => a + b, 0) / presentCount : 0
    const batteryTemp = Number(sensors.battery_temperature_c || 27.14)
    const gas = Number(sensors.gas_sensor_raw || 195)

    const soc = predictions.soc_percent !== null && predictions.soc_percent !== undefined ? Number(predictions.soc_percent) : (presentCount > 0 ? 85.0 : null)
    const soh = predictions.soh_percent !== null && predictions.soh_percent !== undefined ? Number(predictions.soh_percent) : (presentCount > 0 ? 94.0 : null)

    const getCellStatus = (v: number, isRemoved: boolean): CellStatus => {
      if (isRemoved) return 'CELL_REMOVED'
      if (v <= 2.5) return 'critical'
      if (v < 3.0 || Math.abs(v - avgV) > 0.35) return 'warning'
      return 'healthy'
    }

    const backendCells = data.cells || []
    const getCellRisk = (st: CellStatus) => st === 'CELL_REMOVED' ? 0.99 : st === 'critical' ? 0.85 : st === 'warning' ? 0.25 : 0.05

    const cells = [
      {
        index: 1,
        voltage: c1,
        temperature: batteryTemp,
        soc: c1Removed ? null : (backendCells[0]?.soc ?? soc),
        soh: c1Removed ? null : (backendCells[0]?.soh ?? soh),
        current: Number(derived.estimated_current_a ?? 0.3),
        status: getCellStatus(c1, c1Removed),
        deviation: c1Removed ? 0 : Math.round((c1 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c1, c1Removed)),
        gas: gas,
        mlSkipped: c1Removed
      },
      {
        index: 2,
        voltage: c2,
        temperature: batteryTemp,
        soc: c2Removed ? null : (backendCells[1]?.soc ?? soc),
        soh: c2Removed ? null : (backendCells[1]?.soh ?? soh),
        current: Number(derived.estimated_current_a ?? 0.3),
        status: getCellStatus(c2, c2Removed),
        deviation: c2Removed ? 0 : Math.round((c2 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c2, c2Removed)),
        gas: gas,
        mlSkipped: c2Removed
      },
      {
        index: 3,
        voltage: c3,
        temperature: batteryTemp,
        soc: c3Removed ? null : (backendCells[2]?.soc ?? soc),
        soh: c3Removed ? null : (backendCells[2]?.soh ?? soh),
        current: Number(derived.estimated_current_a ?? 0.3),
        status: getCellStatus(c3, c3Removed),
        deviation: c3Removed ? 0 : Math.round((c3 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c3, c3Removed)),
        gas: gas,
        mlSkipped: c3Removed
      }
    ]

    const batteryId = data.battery_id || 'battery-01'

    return {
      batteryId: batteryId,
      timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      voltage: Number(sensors.total_voltage_v || (c1 + c2 + c3)),
      current: Number(derived.estimated_current_a ?? 0.3),
      temperature: batteryTemp,
      soc: presentCount > 0 ? soc : null,
      soh: presentCount > 0 ? soh : null,
      cycleCount: 250,
      status: packStatus,
      chargeState: 'discharging',
      cells: cells,
      presentCells: `${presentCount}/3`,
      packPresenceStatus: presentCount === 3 ? 'ALL_PRESENT' : presentCount === 0 ? 'ALL_REMOVED' : 'CELL MISSING'
    }
  }

  /** Detect safety-relevant events and raise notifications */
  private detectEvents(pack: PackTelemetry) {
    const store = useAppStore.getState()
    if (!store.settings.alertsEnabled) return
    const prev = this.lastCellStatus[pack.batteryId] ?? []

    pack.cells.forEach((cell, i) => {
      const before = prev[i]
      if (before && cell.status !== before && cell.status !== 'healthy') {
        const severityMap: Record<CellStatus, 'healthy' | 'warning' | 'critical'> = {
          healthy: 'healthy',
          warning: 'warning',
          critical: 'critical',
          CELL_REMOVED: 'warning'
        }
        store.pushNotification({
          title: `${store.batteries.find((b) => b.id === pack.batteryId)?.name ?? 'Battery'} · Cell ${String(cell.index).padStart(2, '0')}`,
          body:
            cell.status === 'CELL_REMOVED'
              ? `Cell ${cell.index} was PHYSICALLY REMOVED / DISCONNECTED (~0.07V). ML prediction skipped.`
              : cell.status === 'critical'
              ? `Cell ${cell.index} is now CRITICAL — deviation ${fmtMv(cell.deviation)}, ${fmtTemp(cell.temperature)}.`
              : `Cell ${cell.index} entered warning — deviation ${fmtMv(cell.deviation)}, ${fmtTemp(cell.temperature)}.`,
          severity: severityMap[cell.status] ?? 'warning',
        })
      }
    })
    this.lastCellStatus[pack.batteryId] = pack.cells.map((c) => c.status)
  }

  /** Parses raw object directly from Firebase Realtime Database battery/live */
  private parseRawFirebaseData(raw: any): PackTelemetry | null {
    if (!raw || typeof raw !== 'object') return null

    const extractVal = (keys: string[], defVal: number) => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== null) {
          const num = Number(raw[k])
          if (!isNaN(num)) return num
        }
      }
      return defVal
    }

    const c1 = extractVal(['cell1 voltage', 'cell1_voltage_v', 'cell1_voltage', 'cell1', 'v1'], 3.799)
    const c2 = extractVal(['cell2 voltage', 'cell2_voltage_v', 'cell2_voltage', 'cell2', 'v2'], 3.555)
    const c3 = extractVal(['cell3 voltage', 'cell3_voltage_v', 'cell3_voltage', 'cell3', 'v3'], 3.391)
    const totalV = extractVal(['totalVoltage', 'total_voltage_v', 'pack_voltage_V', 'voltage'], Number((c1 + c2 + c3).toFixed(3)))
    const temp = extractVal(['temperature', 'battery_temperature_c', 'temp'], 27.14)
    const gas = extractVal(['gas', 'gas_sensor_raw'], 195)

    const c1Removed = c1 <= 0.15
    const c2Removed = c2 <= 0.15
    const c3Removed = c3 <= 0.15

    const presentVoltages = [c1, c2, c3].filter((v) => v > 0.15)
    const presentCount = presentVoltages.length
    const avgV = presentCount > 0 ? presentVoltages.reduce((a, b) => a + b, 0) / presentCount : 0

    let packStatus: BatteryStatus = 'healthy'
    if (presentCount < 3 || c1 <= 2.5 || c2 <= 2.5 || c3 <= 2.5) packStatus = 'critical'
    else if (Math.abs(c1 - c2) > 0.35 || Math.abs(c2 - c3) > 0.35) packStatus = 'warning'

    const getCellStatus = (v: number, isRemoved: boolean): CellStatus => {
      if (isRemoved) return 'CELL_REMOVED'
      if (v <= 2.5) return 'critical'
      if (v < 3.0 || Math.abs(v - avgV) > 0.35) return 'warning'
      return 'healthy'
    }

    const getCellRisk = (st: CellStatus) => st === 'CELL_REMOVED' ? 0.99 : st === 'critical' ? 0.85 : st === 'warning' ? 0.25 : 0.05

    const cells = [
      {
        index: 1,
        voltage: c1,
        temperature: temp,
        soc: c1Removed ? null : 85.0,
        soh: c1Removed ? null : 94.0,
        current: 0.3,
        status: getCellStatus(c1, c1Removed),
        deviation: c1Removed ? 0 : Math.round((c1 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c1, c1Removed)),
        gas: gas,
        mlSkipped: c1Removed
      },
      {
        index: 2,
        voltage: c2,
        temperature: temp,
        soc: c2Removed ? null : 85.0,
        soh: c2Removed ? null : 94.0,
        current: 0.3,
        status: getCellStatus(c2, c2Removed),
        deviation: c2Removed ? 0 : Math.round((c2 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c2, c2Removed)),
        gas: gas,
        mlSkipped: c2Removed
      },
      {
        index: 3,
        voltage: c3,
        temperature: temp,
        soc: c3Removed ? null : 85.0,
        soh: c3Removed ? null : 94.0,
        current: 0.3,
        status: getCellStatus(c3, c3Removed),
        deviation: c3Removed ? 0 : Math.round((c3 - avgV) * 1000),
        risk: getCellRisk(getCellStatus(c3, c3Removed)),
        gas: gas,
        mlSkipped: c3Removed
      }
    ]

    return {
      batteryId: '164de9f0-62ee-411a-b8b9-a73eb2406f97',
      timestamp: raw.timestamp ? new Date(raw.timestamp).getTime() : Date.now(),
      voltage: totalV,
      current: 0.3,
      temperature: temp,
      soc: presentCount > 0 ? 85.0 : null,
      soh: presentCount > 0 ? 94.0 : null,
      cycleCount: 250,
      status: packStatus,
      chargeState: 'discharging',
      cells: cells,
      presentCells: `${presentCount}/3`,
      packPresenceStatus: presentCount === 3 ? 'ALL_PRESENT' : presentCount === 0 ? 'ALL_REMOVED' : 'CELL MISSING'
    }
  }

  /** Stream telemetry directly from Firebase Realtime Database if configured */
  private async startFirebaseStream() {
    const store = useAppStore.getState()
    store.setConnection('connecting')
    try {
      const [{ initializeApp, getApps, getApp }, { getDatabase, ref, onValue }] =
        await Promise.all([import('firebase/app'), import('firebase/database')])
      const app = getApps().length ? getApp() : initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://black-box-9aa5e-default-rtdb.firebaseio.com',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })
      const db = getDatabase(app)
      const liveRef = ref(db, 'battery/live')
      const unsub = onValue(liveRef, (snapshot) => {
        const raw = snapshot.val()
        if (raw) {
          const pack = this.parseRawFirebaseData(raw)
          if (pack) {
            this.detectEvents(pack)
            store.setTelemetry(pack)
            store.setConnection('connected')
          }
        }
      })
      this.unsubs.push(unsub)
    } catch (err) {
      console.error('[telemetry] Firebase stream failed, falling back to backend polling', err)
      this.mode = 'backend'
      this.start()
    }
  }

  nextReportId(): string {
    return uid('report')
  }
}

export const telemetryService = new TelemetryService()
