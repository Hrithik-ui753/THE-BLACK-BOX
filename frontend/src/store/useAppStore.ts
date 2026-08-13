import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AIInsight,
  Battery,
  BatteryViewMode,
  ChatMessage,
  ConnectionState,
  NotificationItem,
  PackTelemetry,
  SettingsState,
  User,
} from '@/types'
import { SEED_BATTERIES } from '@/constants/batteries'

const HISTORY_CAP = 1500

interface AppState {
  // ——— auth ———
  user: User | null
  setUser: (user: User | null) => void
  onboardingComplete: boolean
  completeOnboarding: () => void

  // ——— batteries ———
  batteries: Battery[]
  setBatteries: (b: Battery[]) => void
  addBattery: (b: Battery) => void
  removeBattery: (id: string) => void
  updateBatteryStatus: (id: string, status: Battery['status']) => void
  selectedBatteryId: string | null
  selectedCellIndex: number | null
  selectBattery: (id: string | null) => void
  selectCell: (index: number | null) => void

  // ——— telemetry ———
  telemetry: Record<string, PackTelemetry>
  history: Record<string, PackTelemetry[]>
  setTelemetry: (pack: PackTelemetry) => void

  // ——— connection ———
  connection: ConnectionState
  setConnection: (c: ConnectionState) => void

  // ——— AI ———
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  messages: ChatMessage[]
  addMessage: (m: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  aiTyping: boolean
  setAiTyping: (t: boolean) => void
  insight: AIInsight | null
  setInsight: (i: AIInsight | null) => void

  // ——— notifications ———
  notifications: NotificationItem[]
  pushNotification: (n: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void
  markAllRead: () => void
  clearNotifications: () => void

  // ——— UI ———
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  batteryViewMode: BatteryViewMode
  setBatteryViewMode: (m: BatteryViewMode) => void
  settings: SettingsState
  updateSettings: (patch: Partial<SettingsState>) => void
}

const DEFAULT_PACK: PackTelemetry = {
  batteryId: 'battery-01',
  timestamp: Date.now(),
  voltage: 10.745,
  current: 0.3,
  temperature: 27.14,
  soc: 85.0,
  soh: 94.2,
  cycleCount: 250,
  status: 'healthy',
  chargeState: 'discharging',
  cells: [
    { index: 1, voltage: 3.799, temperature: 27.14, soc: 85.0, soh: 94.2, current: 0.3, status: 'healthy', deviation: 0, risk: 0.05, gas: 195 },
    { index: 2, voltage: 3.555, temperature: 27.14, soc: 85.0, soh: 94.2, current: 0.3, status: 'healthy', deviation: -244, risk: 0.05, gas: 195 },
    { index: 3, voltage: 3.391, temperature: 27.14, soc: 85.0, soh: 94.2, current: 0.3, status: 'healthy', deviation: -408, risk: 0.05, gas: 195 }
  ]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      onboardingComplete: true,
      completeOnboarding: () => set({ onboardingComplete: true }),

      batteries: SEED_BATTERIES,
      setBatteries: (batteries) => set({ batteries: (batteries || []).filter(Boolean) }),
      addBattery: (battery) => set({ batteries: [...get().batteries, battery] }),
      removeBattery: (id) =>
        set((s) => ({
          batteries: s.batteries.filter((b) => b?.id !== id),
          selectedBatteryId: s.selectedBatteryId === id ? (s.batteries[0]?.id ?? 'battery-01') : s.selectedBatteryId,
        })),
      updateBatteryStatus: (id, status) =>
        set((s) => ({
          batteries: s.batteries.map((b) => (b?.id === id ? { ...b, status } : b)),
        })),
      selectedBatteryId: 'battery-01',
      selectedCellIndex: null,
      selectBattery: (id) =>
        set({ selectedBatteryId: id || 'battery-01', selectedCellIndex: id === get().selectedBatteryId ? get().selectedCellIndex : null }),
      selectCell: (index) => set({ selectedCellIndex: index }),

      telemetry: {
        'battery-01': DEFAULT_PACK,
        '164de9f0-62ee-411a-b8b9-a73eb2406f97': DEFAULT_PACK,
        'battery-02': DEFAULT_PACK
      },
      history: {
        'battery-01': [DEFAULT_PACK],
        '164de9f0-62ee-411a-b8b9-a73eb2406f97': [DEFAULT_PACK],
        'battery-02': [DEFAULT_PACK]
      },
      setTelemetry: (pack) => {
        const id = pack.batteryId || 'battery-01'
        set((s) => {
          const updatedTelemetry: Record<string, PackTelemetry> = { ...s.telemetry }
          const updatedHistory: Record<string, PackTelemetry[]> = { ...s.history }

          for (const b of s.batteries) {
            if (b?.id) {
              const bPack = { ...pack, batteryId: b.id }
              updatedTelemetry[b.id] = bPack
              const bPrev = s.history[b.id] ?? []
              updatedHistory[b.id] = [...bPrev, bPack].slice(-HISTORY_CAP)
            }
          }

          updatedTelemetry[id] = pack
          updatedTelemetry['battery-01'] = { ...pack, batteryId: 'battery-01' }
          updatedTelemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97'] = { ...pack, batteryId: '164de9f0-62ee-411a-b8b9-a73eb2406f97' }
          updatedTelemetry['battery-02'] = { ...pack, batteryId: 'battery-02' }

          const defaultPrev = s.history['battery-01'] ?? []
          const defaultNext = [...defaultPrev, pack].slice(-HISTORY_CAP)
          updatedHistory[id] = defaultNext
          updatedHistory['battery-01'] = defaultNext
          updatedHistory['164de9f0-62ee-411a-b8b9-a73eb2406f97'] = defaultNext
          updatedHistory['battery-02'] = defaultNext

          return {
            telemetry: updatedTelemetry,
            history: updatedHistory
          }
        })
      },

      connection: 'connected',
      setConnection: (connection) => set({ connection }),

      chatOpen: false,
      setChatOpen: (chatOpen) => set({ chatOpen }),
      messages: [],
      addMessage: (m) =>
        set((s) => ({
          messages: [...s.messages, { ...m, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() }],
        })),
      clearMessages: () => set({ messages: [] }),
      aiTyping: false,
      setAiTyping: (aiTyping) => set({ aiTyping }),
      insight: null,
      setInsight: (insight) => set({ insight }),

      notifications: [],
      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), read: false },
            ...s.notifications,
          ].slice(0, 30),
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      batteryViewMode: '2d',
      setBatteryViewMode: (batteryViewMode) => set({ batteryViewMode }),
      settings: {
        refreshIntervalMs: 3000,
        units: 'metric',
        aiEnabled: true,
        alertsEnabled: true,
        deviceName: 'ESP32-77BC01',
        deviceConnected: true,
      },
      updateSettings: (patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ...patch,
            refreshIntervalMs:
              patch.refreshIntervalMs != null ? Math.max(500, patch.refreshIntervalMs) : s.settings.refreshIntervalMs,
          },
        })),
    }),
    {
      name: 'cellguard-ai',
      version: 4,
      partialize: (s) => ({
        user: s.user,
        onboardingComplete: s.onboardingComplete,
        batteries: s.batteries,
        selectedBatteryId: s.selectedBatteryId || 'battery-01',
        messages: s.messages,
        notifications: s.notifications,
        settings: s.settings,
        sidebarCollapsed: s.sidebarCollapsed,
        batteryViewMode: s.batteryViewMode,
      }),
    },
  ),
)

// ——— derived selectors (keep component re-renders narrow) ———
export const selectPack = (batteryId: string | null) => (s: AppState) => {
  const targetId = batteryId || s.selectedBatteryId || 'battery-01'
  return s.telemetry[targetId] || s.telemetry['battery-01'] || s.telemetry['164de9f0-62ee-411a-b8b9-a73eb2406f97']
}

export const selectHistory = (batteryId: string | null) => (s: AppState) => {
  const targetId = batteryId || s.selectedBatteryId || 'battery-01'
  return s.history[targetId] || s.history['battery-01'] || s.history['164de9f0-62ee-411a-b8b9-a73eb2406f97'] || []
}

export const selectSelectedBattery = (s: AppState) => {
  const found = s.batteries.find((b) => b?.id === s.selectedBatteryId)
  return found ?? s.batteries[0] ?? SEED_BATTERIES[0]
}
