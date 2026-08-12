import type { PackTelemetry } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export interface SupabaseSensorReading {
  id?: number
  battery_id: string
  timestamp?: string
  cell1_voltage_v: number
  cell2_voltage_v: number
  cell3_voltage_v: number
  total_voltage_v: number
  battery_temperature_c: number
  ambient_temperature_c?: number
  gas_sensor_raw?: number
}

class SupabaseService {
  /** READ: Fetch sensor history timeline from Supabase */
  async fetchSensorHistory(batteryId: string = '164de9f0-62ee-411a-b8b9-a73eb2406f97', limit = 50): Promise<PackTelemetry[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/sensor-history/${batteryId}?limit=${limit}`)
      if (!res.ok) return []
      const data = await res.json()
      const rawList = data.history || []
      return rawList.map((row: any) => ({
        batteryId: row.battery_id || batteryId,
        timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
        voltage: row.total_voltage_v || 12.30,
        current: -2.80,
        temperature: row.battery_temperature_c || 35.4,
        soh: 94.2,
        soc: 85.0,
        chargeState: 'discharging',
        cells: [
          { index: 1, voltage: row.cell1_voltage_v || 4.12, deviation: 0, status: 'healthy', temperature: row.battery_temperature_c || 35.4 },
          { index: 2, voltage: row.cell2_voltage_v || 3.65, deviation: -0.47, status: 'warning', temperature: row.battery_temperature_c || 35.4 },
          { index: 3, voltage: row.cell3_voltage_v || 4.10, deviation: -0.02, status: 'healthy', temperature: row.battery_temperature_c || 35.4 },
        ],
      }))
    } catch (err) {
      console.warn('[SupabaseService] Fetch history fallback:', err)
      return []
    }
  }

  /** CREATE: Record telemetry payload into Supabase sensor_history */
  async recordSensorReading(pack: PackTelemetry): Promise<boolean> {
    try {
      const payload = {
        battery_id: '164de9f0-62ee-411a-b8b9-a73eb2406f97',
        cell1_voltage_v: pack.cells?.[0]?.voltage ?? 4.12,
        cell2_voltage_v: pack.cells?.[1]?.voltage ?? 3.65,
        cell3_voltage_v: pack.cells?.[2]?.voltage ?? 4.10,
        total_voltage_v: pack.voltage ?? 12.30,
        battery_temperature_c: pack.temperature ?? 35.4,
        ambient_temperature_c: 30.1,
        gas_sensor_raw: 215,
      }
      const res = await fetch(`${BACKEND_URL}/api/db/sensor-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      return res.ok
    } catch (err) {
      console.warn('[SupabaseService] Record telemetry failed:', err)
      return false
    }
  }

  /** READ: Fetch batteries from Supabase */
  async fetchBatteries() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/batteries`)
      if (!res.ok) return []
      const data = await res.json()
      return data.batteries || []
    } catch (err) {
      return []
    }
  }
}

export const supabaseService = new SupabaseService()
