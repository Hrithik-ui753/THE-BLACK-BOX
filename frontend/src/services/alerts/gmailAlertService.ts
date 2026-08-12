import type { PackTelemetry } from '@/types'

export interface AlertConfig {
  isConfigured: boolean
  smtpHost: string
  smtpPort: number
  gmailUser: string
  defaultRecipient: string
}

export interface AlertHistoryItem {
  battery_id: string
  timestamp: string
  severity: string
  min_voltage: number
  imbalance_v: number
  health_score: number
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class GmailAlertService {
  private lastAlertTime: Record<string, number> = {}

  async getConfig(): Promise<AlertConfig> {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/config`)
      if (!res.ok) throw new Error('Failed to fetch config')
      return await res.json()
    } catch {
      return {
        isConfigured: false,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        gmailUser: 'Not connected',
        defaultRecipient: 'Not set',
      }
    }
  }

  async getHistory(): Promise<AlertHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/history`)
      if (!res.ok) return []
      const data = await res.json()
      return data.history ?? []
    } catch {
      return []
    }
  }

  async sendTestAlert(recipientEmail?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/test-gmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: recipientEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send test email')
      return { success: true, message: data.message || 'Test email dispatched successfully!' }
    } catch (err: any) {
      return { success: false, message: err.message || 'Error communicating with Python Gmail SMTP backend.' }
    }
  }

  async evaluateAndSendAlert(pack: PackTelemetry, recipientEmail?: string, forceSend = false): Promise<void> {
    const now = Date.now()
    const lastSent = this.lastAlertTime[pack.batteryId] ?? 0

    // Throttle client requests to at most once per 10 seconds unless forceSend
    if (!forceSend && now - lastSent < 10000) return
    this.lastAlertTime[pack.batteryId] = now

    const minV = pack.cells?.length ? Math.min(...pack.cells.map((c) => c.voltage)) : pack.voltage / (pack.cells?.length || 6)
    const maxV = pack.cells?.length ? Math.max(...pack.cells.map((c) => c.voltage)) : minV
    const imbalanceV = maxV - minV

    // Quick client filter before hitting backend: trigger if anomaly or voltage drop or imbalance or high temp
    const isCritical = minV < 2.80 || imbalanceV > 0.20 || pack.temperature > 55
    const isWarning = imbalanceV > 0.10 || pack.temperature > 45 || pack.soh < 80

    if (!forceSend && !isCritical && !isWarning) return

    try {
      await fetch(`${API_BASE}/api/alerts/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battery_id: pack.batteryId,
          battery_name: `Battery Unit (${pack.batteryId})`,
          health_score: isCritical ? 46 : 75,
          soh_pct: pack.soh,
          overall_risk: isCritical ? 'CRITICAL' : 'WARNING',
          anomaly_score: isCritical ? 94 : 45,
          temperature: pack.temperature,
          rise_rate: 2.1,
          cells: pack.cells?.map((c) => ({
            index: c.index,
            voltage: c.voltage,
            temperature: c.temperature,
            status: c.status,
          })),
          recipient_email: recipientEmail,
          force_send: forceSend,
        }),
      })
    } catch (err) {
      console.warn('[GmailAlertService] Alert API request failed or backend offline.', err)
    }
  }
}

export const gmailAlertService = new GmailAlertService()
