import type { Battery, CellStatus, ChargeState } from '@/types'

/** Core 3-cell battery setups — 3 Individual Cells Module (Cell 1, Cell 2, Cell 3). */
export const SEED_BATTERIES: Battery[] = [
  {
    id: 'battery-01',
    userId: 'demo-user',
    name: '3 Individual Cells Module',
    type: 'Modular · 3x Individual Cells (Cell 1, Cell 2, Cell 3)',
    mode: 'individual_cells',
    cellCount: 3,
    status: 'healthy',
    deviceId: 'ESP32-77BC01',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
  },
  {
    id: 'battery-02',
    userId: 'demo-user',
    name: '3 Individual Cells Module (Pack 2)',
    type: 'Modular · 3x Individual Cells (Cell 1, Cell 2, Cell 3)',
    mode: 'individual_cells',
    cellCount: 3,
    status: 'warning',
    deviceId: 'ESP32-77BC02',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 110,
  },
]

export interface CellProfile {
  /** base voltage when healthy */
  vBase: number
  /** temperature base */
  tBase: number
  /** voltage offset to model imbalance */
  vOffset: number
  /** temperature offset */
  tOffset: number
  status: CellStatus
  /** gas 0–100 (safety anomaly) */
  gas: number
}

export interface BatterySimProfile {
  id: string
  soh: number
  cycleCount: number
  socCenter: number
  chargeState: ChargeState
  current: number
  tempBase: number
  vBase: number
  status: 'healthy' | 'warning' | 'critical'
  cells: CellProfile[]
}

export const SIM_PROFILES: BatterySimProfile[] = [
  {
    id: 'battery-01',
    soh: 94.2,
    cycleCount: 142,
    socCenter: 76,
    chargeState: 'discharging',
    current: 0.3,
    tempBase: 27.14,
    vBase: 3.582,
    status: 'healthy',
    cells: [
      { vBase: 3.799, tBase: 27.14, vOffset: 0.0, tOffset: 0.0, status: 'healthy', gas: 195 },
      { vBase: 3.555, tBase: 27.14, vOffset: -0.24, tOffset: 0.0, status: 'healthy', gas: 195 },
      { vBase: 3.391, tBase: 27.14, vOffset: -0.40, tOffset: 0.0, status: 'healthy', gas: 195 },
    ],
  },
  {
    id: 'battery-02',
    soh: 84.8,
    cycleCount: 316,
    socCenter: 61,
    chargeState: 'charging',
    current: 0.3,
    tempBase: 31.6,
    vBase: 3.86,
    status: 'warning',
    cells: Array.from({ length: 3 }, (_, i) => {
      const warning = i === 1
      return {
        vBase: warning ? 3.65 : 4.05,
        tBase: warning ? 38.4 : 31.2,
        vOffset: warning ? -0.40 : 0.0,
        tOffset: warning ? 6.8 : 0.0,
        status: (warning ? 'warning' : 'healthy') as CellStatus,
        gas: warning ? 24 : 0,
      }
    }),
  },
]
