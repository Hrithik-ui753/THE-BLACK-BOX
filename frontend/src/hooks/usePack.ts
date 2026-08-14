import { useAppStore } from '@/store/useAppStore'
import type { Battery, PackTelemetry } from '@/types'

export function useBattery(id: string | null | undefined): Battery | null {
  return useAppStore((s) => {
    const list = (s.batteries || []).filter(Boolean)
    if (!id) return list[0] ?? null
    const found = list.find((b) => b?.id === id)
    if (found) return found

    // Construct dynamic battery metadata for UUIDs or backend battery IDs
    return {
      id: id,
      userId: 'demo-user',
      name: '3 Individual Cells Module',
      type: 'Modular · 3x Individual Cells (Cell 1, Cell 2, Cell 3)',
      mode: 'individual_cells',
      cellCount: 3,
      status: 'healthy',
      deviceId: 'ESP32-77BC01',
      createdAt: Date.now()
    }
  })
}

export function usePack(batteryId: string | null | undefined): PackTelemetry | undefined {
  return useAppStore((s) => {
    if (batteryId && s.telemetry?.[batteryId]) return s.telemetry[batteryId]
    if (batteryId && s.history?.[batteryId]?.length) return s.history[batteryId][s.history[batteryId].length - 1]
    if (s.selectedBatteryId && s.telemetry?.[s.selectedBatteryId]) return s.telemetry[s.selectedBatteryId]
    return (
      s.telemetry?.['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      s.telemetry?.['battery-01'] ||
      (s.telemetry ? Object.values(s.telemetry)[0] : undefined) ||
      (s.history?.['164de9f0-62ee-411a-b8b9-a73eb2406f97']?.slice(-1)[0]) ||
      (s.history?.['battery-01']?.slice(-1)[0])
    )
  })
}

export function usePackHistory(batteryId: string | null | undefined): PackTelemetry[] {
  return useAppStore((s) => {
    if (batteryId && s.history?.[batteryId]?.length) return s.history[batteryId]
    if (s.selectedBatteryId && s.history?.[s.selectedBatteryId]?.length) return s.history[s.selectedBatteryId]
    return (
      s.history?.['164de9f0-62ee-411a-b8b9-a73eb2406f97'] ||
      s.history?.['battery-01'] ||
      (s.history ? Object.values(s.history)[0] : undefined) ||
      []
    )
  })
}
