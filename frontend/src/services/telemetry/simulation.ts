import type {
  BatteryStatus,
  CellStatus,
  CellTelemetry,
  ChargeState,
  PackTelemetry,
} from '@/types'
import { SIM_PROFILES, type BatterySimProfile, type CellProfile } from '@/constants/batteries'
import { clamp, round } from '@/utils/format'

interface SimCell {
  v: number
  t: number
  profile: CellProfile
  prevStatus: CellStatus
  gas: number
}

interface SimBattery {
  profile: BatterySimProfile
  soh: number
  cycleCount: number
  soc: number
  current: number
  chargeState: ChargeState
  stateTimer: number
  cycleTimer: number
  cells: SimCell[]
}

function deriveCellStatus(voltage: number, temp: number): CellStatus {
  if (voltage <= 0.15) return 'CELL_REMOVED'
  if (voltage <= 2.50 || temp > 55) return 'critical'
  if (voltage < 3.00 || temp > 45) return 'warning'
  return 'healthy'
}

function derivePackStatus(cells: CellTelemetry[]): BatteryStatus {
  if (cells.some((c) => c.status === 'critical')) return 'critical'
  if (cells.some((c) => c.status === 'warning')) return 'warning'
  return 'healthy'
}

function buildCell(index: number, c: SimCell, avgV: number): CellTelemetry {
  const deviation = (c.v - avgV) * 1000
  const status = deriveCellStatus(c.v, c.t)
  
  // Calibrated accurate risk score
  let risk = 0.04
  if (status === 'CELL_REMOVED') risk = 0.99
  else if (status === 'critical') risk = 0.85
  else if (status === 'warning') risk = 0.25
  else risk = clamp(0.04 + (c.t > 35 ? (c.t - 35) * 0.01 : 0), 0.03, 0.08)

  return {
    index: index + 1,
    voltage: round(c.v),
    temperature: round(c.t, 1),
    soc: round(clamp(c.v / 4.2, 0.15, 1) * 100, 1),
    soh: 94.2,
    current: 0,
    status,
    deviation: round(deviation, 1),
    risk: round(risk, 3),
    gas: round(c.gas),
  }
}

function createBatteryState(profile: BatterySimProfile): SimBattery {
  return {
    profile,
    soh: profile.soh,
    cycleCount: profile.cycleCount,
    soc: profile.socCenter,
    current: profile.current,
    chargeState: profile.chargeState,
    stateTimer: Math.random() * 240,
    cycleTimer: 90 + Math.random() * 160,
    cells: profile.cells.map((cp) => ({
      v: cp.vBase + cp.vOffset + (Math.random() - 0.5) * 0.01,
      t: cp.tBase + cp.tOffset + (Math.random() - 0.5) * 0.4,
      profile: cp,
      prevStatus: cp.status,
      gas: cp.gas,
    })),
  }
}

export class SimulationEngine {
  private states = new Map<string, SimBattery>()
  private tickCount = 0

  constructor() {
    for (const p of SIM_PROFILES) this.states.set(p.id, createBatteryState(p))
  }

  registerBattery(id: string, index = 0): PackTelemetry {
    if (!this.states.has(id)) {
      const template = SIM_PROFILES[index % SIM_PROFILES.length]
      this.states.set(id, createBatteryState({ ...template, id }))
    }
    const st = this.states.get(id)!
    return this.snapshot(id, st, Date.now())
  }

  /** Backfill plausible 24h history so analytics charts are populated on first load. */
  backfill(points = 720, stepMs = 120_000): Record<string, PackTelemetry[]> {
    const out: Record<string, PackTelemetry[]> = {}
    const now = Date.now()
    for (const [id, st] of this.states) {
      const series: PackTelemetry[] = []
      for (let i = points - 1; i >= 0; i--) {
        const ts = now - i * stepMs
        // mean-reverting random walk so history stays near the cell's profile
        for (const c of st.cells) {
          const target = c.profile.vBase + c.profile.vOffset
          c.v = clamp(c.v + (target - c.v) * 0.06 + (Math.random() - 0.5) * 0.02, 2.8, 4.25)
          const tTarget = c.profile.tBase + c.profile.tOffset
          c.t = clamp(c.t + (tTarget - c.t) * 0.04 + (Math.random() - 0.5) * 0.35, 18, 45)
        }
        st.soc = clamp(st.soc + (Math.random() - 0.5) * 1.4, 20, 95)
        st.soh = clamp(st.soh - Math.random() * 0.0012, 50, 100)
        series.push(this.snapshot(id, st, ts))
      }
      out[id] = series
    }
    return out
  }

  /** Advance one live tick for every simulated battery. */
  tick(intervalMs: number): PackTelemetry[] {
    this.tickCount++
    const out: PackTelemetry[] = []
    const now = Date.now()
    for (const [id, st] of this.states) {
      this.advance(st, intervalMs)
      out.push(this.snapshot(id, st, now))
    }
    return out
  }

  private advance(st: SimBattery, dt: number) {
    const p = st.profile
    st.stateTimer -= dt / 1000
    if (st.stateTimer <= 0) {
      // flip between charging / discharging occasionally
      st.chargeState = st.chargeState === 'charging' ? 'discharging' : 'charging'
      st.stateTimer = 180 + Math.random() * 300
    }
    st.cycleTimer -= dt / 1000
    if (st.cycleTimer <= 0) {
      st.cycleCount += 1
      st.soh = clamp(st.soh - (0.01 + Math.random() * 0.02), 50, 100)
      st.cycleTimer = 120 + Math.random() * 240
    }

    const rate = p.current * (0.85 + Math.random() * 0.3)
    st.current = st.chargeState === 'charging' ? rate : st.chargeState === 'discharging' ? -rate : 0
    st.soc = clamp(st.soc + (st.current * (dt / 1000)) / 3600 / 2.5 * 100, 15, 95)
    if (st.soc >= 94.5 && st.chargeState === 'charging') {
      st.chargeState = 'discharging'
      st.stateTimer = 240 + Math.random() * 300
    } else if (st.soc <= 18 && st.chargeState === 'discharging') {
      st.chargeState = 'charging'
      st.stateTimer = 240 + Math.random() * 300
    }

    for (const c of st.cells) {
      // Terminal voltage = OCV − I·R. Discharge (I<0) pulls the terminal
      // voltage down, charging pushes it up.
      const target = c.profile.vBase + c.profile.vOffset - st.current * 0.008
      c.v = clamp(c.v + (target - c.v) * 0.03 + (Math.random() - 0.5) * 0.006, 2.8, 4.25)
      const heat = st.current * 0.004
      const drift = c.profile.status === 'critical' ? 0.004 : c.profile.status === 'warning' ? 0.0015 : 0
      c.t = clamp(c.t + (c.profile.tBase + c.profile.tOffset - c.t) * 0.02 + (Math.random() - 0.5) * 0.09 + heat + drift, 18, 48)
      c.gas = clamp(c.gas + (c.profile.gas - c.gas) * 0.01 + (Math.random() - 0.5) * 1.6, 0, 90)
    }
  }

  private snapshot(id: string, st: SimBattery, ts: number): PackTelemetry {
    const avgV = st.cells.reduce((a, c) => a + c.v, 0) / st.cells.length
    const cells = st.cells.map((c, i) => buildCell(i, c, avgV))
    // 3S layout: Pack voltage = sum of the 3 series cell voltages
    const packV = cells.reduce((a, c) => a + c.voltage, 0)
    const avgT = cells.reduce((a, c) => a + c.temperature, 0) / cells.length
    const status = derivePackStatus(cells)
    return {
      batteryId: id,
      timestamp: ts,
      voltage: round(packV),
      current: round(st.current, 1),
      temperature: round(avgT, 1),
      soc: round(st.soc, 1),
      soh: round(st.soh, 2),
      cycleCount: st.cycleCount,
      status,
      chargeState: st.chargeState,
      cells,
    }
  }
}
