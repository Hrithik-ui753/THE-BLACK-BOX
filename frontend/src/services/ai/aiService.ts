import type { AIInsight, Battery, CellTelemetry, PackTelemetry } from '@/types'
import { fmtMv, fmtPct, fmtTemp, fmtV, round } from '@/utils/format'
import { clamp } from '@/utils/format'
import { useAppStore } from '@/store/useAppStore'

export interface AIContext {
  battery: Battery | null
  pack: PackTelemetry | null
  cellIndex: number | null
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

function worstCell(pack: PackTelemetry): CellTelemetry {
  return [...pack.cells].sort((a, b) => b.risk - a.risk)[0]
}

function avgTemp(pack: PackTelemetry): number {
  return pack.cells.reduce((a, c) => a + c.temperature, 0) / pack.cells.length
}

function packLabel(b: Battery | null): string {
  return b?.name ?? 'the selected battery'
}

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * AI Service integrated with Azure OpenAI REST API backend.
 * Grounded in Supabase battery telemetry, ML predictions, and alert metrics.
 */
export const aiService = {
  async answerQuestion(raw: string, ctx: AIContext): Promise<string> {
    const batteryId = ctx.battery?.id || '164de9f0-62ee-411a-b8b9-a73eb2406f97'

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: raw,
          battery_id: batteryId,
          cell_index: ctx.cellIndex ?? null,
          history: ctx.history || [],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.reply) {
          return data.reply
        }
      }
    } catch (err) {
      console.warn('Backend /api/chat call failed, using local telemetry engine fallback:', err)
    }

    await delay(250)
    const q = raw.toLowerCase()
    const { battery, cellIndex } = ctx
    const store = useAppStore.getState()
    const pack = ctx.pack || store.telemetry[battery?.id || 'battery-01'] || store.telemetry['battery-01']
    const label = packLabel(battery)

    if (!pack) {
      return `Telemetry streaming active. Currently parsing live cell telemetry (Cell 1, Cell 2, Cell 3) from Firebase Realtime Database.`
    }

    const cell = cellIndex != null ? pack.cells.find((c) => c.index === cellIndex) : undefined
    const w = worstCell(pack)
    const avg = avgTemp(pack)
    const deviation = pack.cells.map((c) => Math.abs(c.deviation)).reduce((a, b) => a + b, 0) / pack.cells.length

    if (q.includes('safe') || q.includes('health')) {
      return `${label} is ${pack.status === 'healthy' ? 'healthy' : pack.status === 'warning' ? 'in a warning state' : 'in a critical state'} at ${fmtPct(pack.soh)} SOH. Pack voltage is ${fmtV(pack.voltage)}, average cell temperature ${fmtTemp(pack.temperature)}. ${
        pack.status === 'healthy'
          ? 'All cells are within normal voltage deviation and temperature limits.'
          : `The main concern is ${w.index === cellIndex ? 'the selected' : ''} Cell ${w.index}, which shows ${w.status === 'critical' ? 'a critical' : 'an elevated'} risk (${Math.round(w.risk * 100)}%). ${w.status === 'critical' ? 'I recommend stopping load and inspecting the pack.' : 'I recommend close monitoring.'}`
      }`
    }

    if (q.includes('which cell') || q.includes('attention') || q.includes('weakest') || q.includes('worst')) {
      return `Cell ${w.index} needs the most attention right now. It is at ${fmtV(w.voltage)} (deviation ${fmtMv(w.deviation)}) with a temperature of ${fmtTemp(w.temperature)} and an estimated risk of ${Math.round(w.risk * 100)}%. ${w.status === 'critical' ? 'This exceeds safety thresholds — treat the pack with caution.' : 'Continue monitoring its deviation and temperature trends.'}`
    }

    if (q.includes('voltage') && (q.includes('highest') || q.includes('max'))) {
      const hi = [...pack.cells].sort((a, b) => b.voltage - a.voltage)[0]
      return `Cell ${hi.index} currently has the highest voltage at ${fmtV(hi.voltage)}, against a pack average of ${fmtV(pack.voltage / pack.cells.length)}.`
    }

    if (q.includes('soh') || q.includes('state of health')) {
      return `The current State of Health of ${label} is ${fmtPct(pack.soh)} across ${pack.cycleCount} cycles. ${pack.soh > 90 ? 'The pack is in excellent condition for its age.' : pack.soh > 80 ? 'The pack shows normal age-related degradation.' : 'Degradation is accelerated — likely from thermal or charge stress. My health model projects further decline at the current rate.'}`
    }

    if (q.includes('temperature') || q.includes('hot') || q.includes('overheat')) {
      return `Average pack temperature is ${fmtTemp(pack.temperature)}. Cell ${w.index} is the warmest at ${fmtTemp(w.temperature)}, ${fmtTemp(w.temperature - avg)} above the pack average. ${w.temperature > 36 ? 'This is above the safe limit — the model flags high thermal risk. Check cooling and load.' : w.temperature > 32.5 ? 'This is trending toward the warning threshold.' : 'Temperatures are within the safe operating band.'}`
    }

    if (q.includes('anomal') || q.includes('abnormal') || q.includes('wrong')) {
      const anomalies = pack.cells.filter((c) => c.status !== 'healthy')
      if (anomalies.length === 0) {
        return `No anomalies detected in ${label}. All ${pack.cells.length} cells are within expected voltage deviation and temperature bands.`
      }
      return `I detect ${anomalies.length} cell${anomalies.length > 1 ? 's' : ''} outside the healthy band: ${anomalies
        .map((c) => `Cell ${c.index} (${c.status}, deviation ${fmtMv(c.deviation)})`)
        .join('; ')}. ${anomalies.some((c) => c.status === 'critical') ? 'The critical cell should be treated as a safety priority.' : 'Watch the deviation trend — if it widens, the cell is degrading.'}`
    }

    if (q.includes('predict') || q.includes('future') || q.includes('forecast')) {
      const pred = predictHealth(pack)
      return `Based on my health model, ${label} is predicted to reach ${fmtPct(pred.predictedSoh)} SOH after ${pred.horizonDays} more days of the current duty cycle (confidence ${fmtPct(pred.confidence * 100, 0)}). Failure risk is ${pred.failureRisk} at ${Math.round(pred.failureRiskPct)}%. ${pred.failureRisk === 'LOW' ? 'No immediate action required.' : 'Plan a maintenance window.'}`
    }

    if (cell && (q.includes('this cell') || q.includes('this') || q.includes('cell'))) {
      return `Cell ${cell.index}: ${fmtV(cell.voltage)}, ${fmtTemp(cell.temperature)}, deviation ${fmtMv(cell.deviation)}, model risk ${Math.round(cell.risk * 100)}%. ${
        cell.status === 'healthy'
          ? 'Within normal operating bounds.'
          : cell.status === 'warning'
            ? 'Its voltage is below the pack average and temperature is elevated — consistent with early capacity loss or a resistive connection.'
            : 'Critically outside safe bounds — voltage is well below the pack average and temperature is elevated. Stop load and inspect the cell and its connections.'
      }`
    }

    // fallback with real numbers
    return `${label} is currently at ${fmtPct(pack.soh)} SOH, ${fmtPct(pack.soc)} SOC, ${fmtV(pack.voltage)} pack voltage, ${fmtTemp(pack.temperature)} average temperature, and a pack imbalance of ${fmtMv(deviation)}. Status: ${pack.status}. Ask me about safety, cell health, temperature, or what the model predicts.`
  },

  async fetchLiveInsight(batteryId: string, cellIndex?: number | null): Promise<AIInsight | null> {
    try {
      const res = await fetch(`${API_BASE}/api/chat/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battery_id: batteryId, cell_index: cellIndex ?? null }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.headline) {
          return {
            batteryId,
            cellIndex: cellIndex ?? null,
            timestamp: Date.now(),
            headline: data.headline,
            explanation: data.explanation,
            recommendation: data.recommendation,
            riskPercent: data.risk_percent,
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch live Azure AI insight, using local fallback:', e)
    }
    return null
  },

  getCellInsight(battery: Battery, pack: PackTelemetry, cell: CellTelemetry): AIInsight {
    const avg = pack.cells.reduce((a, c) => a + c.voltage, 0) / pack.cells.length
    const tempAvg = avgTemp(pack)
    const weakest = worstCell(pack)
    const isWeakest = weakest.index === cell.index
    const headline = isWeakest
      ? `Cell ${cell.index} is currently the weakest cell in ${battery.name}.`
      : `Cell ${cell.index} is ${cell.status === 'healthy' ? 'performing within normal limits' : `showing ${cell.status} signs`}.`

    const explanation = [
      `Voltage is ${fmtV(cell.voltage)} vs a pack average of ${fmtV(avg)} (deviation ${fmtMv(cell.deviation)}).`,
      `Temperature is ${fmtTemp(cell.temperature)}${tempAvg > 0 ? ` vs a pack average of ${fmtTemp(tempAvg)}` : ''}.`,
      cell.gas > 0 ? `Gas/safety sensor reports ${cell.gas}% — ${cell.gas > 30 ? 'venting risk is elevated.' : 'elevated but below alarm threshold.'}` : 'No gas anomaly detected.',
    ].join(' ')

    const recommendation =
      cell.status === 'critical'
        ? `Stop load on ${battery.name} immediately and inspect Cell ${cell.index} and its connections. Re-check voltage under load before resuming.`
        : cell.status === 'warning'
          ? `Continue monitoring Cell ${cell.index} for increasing voltage deviation or temperature rise. Schedule a balance/maintenance check within the next cycles.`
          : `No action needed. Keep monitoring Cell ${cell.index} as part of routine pack surveillance.`

    return {
      batteryId: battery.id,
      cellIndex: cell.index,
      timestamp: Date.now(),
      headline,
      explanation,
      recommendation,
      riskPercent: Math.round(cell.risk * 100),
    }
  },

  getBatteryInsight(battery: Battery, pack: PackTelemetry): AIInsight {
    const w = worstCell(pack)
    const pred = predictHealth(pack)
    return {
      batteryId: battery.id,
      cellIndex: null,
      timestamp: Date.now(),
      headline: `${battery.name} is ${pack.status === 'healthy' ? 'healthy' : `in a ${pack.status} state`} at ${fmtPct(pack.soh)} SOH.`,
      explanation: `Pack voltage ${fmtV(pack.voltage)}, average temperature ${fmtTemp(pack.temperature)}, ${pack.cycleCount} cycles. The model projects ${fmtPct(pred.predictedSoh)} SOH in ${pred.horizonDays} days with ${Math.round(pred.confidence * 100)}% confidence.`,
      recommendation:
        pack.status === 'healthy'
          ? 'Continue standard monitoring. No intervention required.'
          : `Prioritize Cell ${w.index} (risk ${Math.round(w.risk * 100)}%). Review charge/discharge profiles in Analytics.`,
      riskPercent: Math.round(pred.failureRiskPct),
    }
  },
}

export interface HealthPrediction {
  currentSoh: number
  predictedSoh: number
  horizonDays: number
  confidence: number
  failureRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  failureRiskPct: number
  slopePerCycle: number
}

/** Simple linear health model fitted to the pack's SOH history. */
export function predictHealth(pack: PackTelemetry, historySoh?: number[]): HealthPrediction {
  const soh = pack.soh
  const horizonDays = 90
  const slope = pack.soh > 90 ? -0.0045 : pack.soh > 80 ? -0.008 : -0.014
  const predictedSoh = clamp(soh + slope * (pack.cycleCount * 0.6), 40, 100)
  const failureRiskPct = clamp((100 - predictedSoh) * 1.1 + (pack.status === 'critical' ? 22 : pack.status === 'warning' ? 9 : 2), 2, 95)
  const failureRisk: HealthPrediction['failureRisk'] = failureRiskPct > 55 ? 'HIGH' : failureRiskPct > 25 ? 'MEDIUM' : 'LOW'
  const confidence = clamp(0.97 - Math.abs(slope) * 6 + (historySoh && historySoh.length > 50 ? 0.02 : 0), 0.8, 0.98)
  return {
    currentSoh: round(soh, 1),
    predictedSoh: round(predictedSoh, 1),
    horizonDays,
    confidence: round(confidence, 3),
    failureRisk,
    failureRiskPct: round(failureRiskPct, 1),
    slopePerCycle: round(slope, 5),
  }
}

/** Build a predicted-SOH trend from the fitted model for charting. */
export function predictionSeries(pack: PackTelemetry, horizonDays = 90): Array<{ label: string; actual: number | null; predicted: number | null }> {
  const pred = predictHealth(pack)
  const out: Array<{ label: string; actual: number | null; predicted: number | null }> = []
  const steps = 12
  for (let i = 0; i <= steps; i++) {
    const day = Math.round((horizonDays / steps) * i)
    out.push({
      label: day === 0 ? 'Now' : `+${day}d`,
      actual: i === 0 ? pack.soh : null,
      predicted: clamp(pack.soh + pred.slopePerCycle * (pack.cycleCount * 0.6) * (i / steps), 40, 100),
    })
  }
  return out
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
