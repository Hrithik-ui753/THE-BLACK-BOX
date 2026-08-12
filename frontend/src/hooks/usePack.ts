import { useAppStore } from '@/store/useAppStore'
import type { Battery, PackTelemetry } from '@/types'

export function useBattery(id: string | null | undefined): Battery | null {
  return useAppStore((s) => s.batteries.find((b) => b.id === id) ?? null)
}

export function usePack(batteryId: string | null | undefined): PackTelemetry | undefined {
  return useAppStore((s) => {
    if (batteryId && s.telemetry[batteryId]) return s.telemetry[batteryId]
    if (s.selectedBatteryId && s.telemetry[s.selectedBatteryId]) return s.telemetry[s.selectedBatteryId]
    return s.telemetry['battery-01'] || s.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] || Object.values(s.telemetry)[0]
  })
}

export function usePackHistory(batteryId: string | null | undefined): PackTelemetry[] {
  return useAppStore((s) => {
    if (batteryId && s.history[batteryId]?.length) return s.history[batteryId]
    if (s.selectedBatteryId && s.history[s.selectedBatteryId]?.length) return s.history[s.selectedBatteryId]
    return s.history['battery-01'] || s.history['164de9f0-62ee-411a-b8b9-a73eb2406f97'] || Object.values(s.history)[0] || []
  })
}
