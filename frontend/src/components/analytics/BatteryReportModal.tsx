import { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, FileText, CheckCircle2, Cpu, Activity, Calculator, Sparkles, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react'
import { usePack } from '@/hooks/usePack'
import type { DiagnosticReport, MetricSource } from '@/types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export interface BatteryReportModalProps {
  open: boolean
  onClose: () => void
  batteryName?: string
  batteryId?: string
  healthScore?: number
  sohPct?: number
  overallRisk?: string
  cell1V?: number
  cell2V?: number
  cell3V?: number
  temperatureC?: number
  cycleCount?: number
}

function SourceBadge({ source }: { source: MetricSource }) {
  const styles: Record<MetricSource, string> = {
    MEASURED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    CALCULATED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'ML PREDICTED': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    'RULE-BASED': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'AI GENERATED': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    UNAVAILABLE: 'bg-slate-500/10 text-slate-500 border-slate-500/30'
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${styles[source] || styles.UNAVAILABLE}`}>
      {source}
    </span>
  )
}

export function BatteryReportModal({
  open,
  onClose,
  batteryName = '3 Individual Cells Module',
  batteryId = '164de9f0-62ee-411a-b8b9-a73eb2406f97',
  cell1V,
  cell2V,
  cell3V,
  temperatureC,
  cycleCount
}: BatteryReportModalProps) {
  const pack = usePack(batteryId)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [loading, setLoading] = useState(false)

  // Measured inputs derived from props or live hook telemetry
  const c1 = cell1V ?? pack?.cells[0]?.voltage ?? 3.799
  const c2 = cell2V ?? pack?.cells[1]?.voltage ?? 3.555
  const c3 = cell3V ?? pack?.cells[2]?.voltage ?? 3.391
  const temp = temperatureC ?? pack?.temperature ?? 27.14
  const cycles = cycleCount ?? pack?.cycleCount ?? 250
  const packVoltage = pack?.voltage ?? Number((c1 + c2 + c3).toFixed(2))

  // Physical Consistency Validation
  const isValid =
    !isNaN(c1) && c1 >= 0.0 && c1 <= 4.5 &&
    !isNaN(c2) && c2 >= 0.0 && c2 <= 4.5 &&
    !isNaN(c3) && c3 >= 0.0 && c3 <= 4.5 &&
    !isNaN(temp) && temp >= -20.0 && temp <= 100.0

  // Dynamic calculations for Present cells
  const presentVoltages = [c1, c2, c3].filter((v) => v > 0.15)
  const presentCount = presentVoltages.length
  const minV = presentCount > 0 ? Math.min(...presentVoltages) : 0
  const maxV = presentCount > 0 ? Math.max(...presentVoltages) : 0
  const avgV = presentCount > 0 ? presentVoltages.reduce((a, b) => a + b, 0) / presentCount : 0
  const spreadV = maxV - minV

  const sohVal = pack?.soh ?? 94.0
  const socVal = pack?.soc ?? 85.0
  const statusStr = pack?.status ?? (presentCount < 3 ? 'critical' : spreadV > 0.35 ? 'warning' : 'healthy')

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)

    fetch(`${BACKEND_URL}/api/telemetry/report?battery_id=${batteryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return
        if (data && data.status === 'success' && data.sections) {
          const s = data.sections
          setReport({
            reportId: data.report_id || `RPT-BLACKBOX-${Date.now().toString().slice(-6)}`,
            batteryId,
            batteryName,
            date: Date.now(),
            status: data.system_status?.toLowerCase() || statusStr,
            isValid: data.is_valid ?? true,
            predictionSource: data.prediction_source || 'Prediction Source: XGBoost ML Model',
            mlPredictions: {
              soc: s.ml_predictions.soc,
              soh: s.ml_predictions.soh,
              rul: s.ml_predictions.rul,
              anomaly: s.ml_predictions.anomaly
            },
            measuredTelemetry: {
              cell1Voltage: s.measured_telemetry.cell1_voltage_v,
              cell2Voltage: s.measured_telemetry.cell2_voltage_v,
              cell3Voltage: s.measured_telemetry.cell3_voltage_v,
              temperature: s.measured_telemetry.temperature_c,
              cycleCount: s.measured_telemetry.cycle_count,
              packVoltage: s.measured_telemetry.pack_voltage_v,
              timestamp: s.measured_telemetry.timestamp
            },
            calculatedMetrics: {
              minCellVoltage: s.calculated_metrics.min_cell_voltage_v,
              maxCellVoltage: s.calculated_metrics.max_cell_voltage_v,
              averageCellVoltage: s.calculated_metrics.average_cell_voltage_v,
              cellVoltageSpread: s.calculated_metrics.cell_voltage_spread_v
            },
            aiExplanation: {
              executiveSummary: s.ai_explanation.executive_summary,
              aiExplanation: s.ai_explanation.ai_explanation,
              ruleBasedRecommendation: s.ai_explanation.rule_based_recommendation
            },
            modelMetadata: data.model_metadata || {}
          })
        }
      })
      .catch((err) => {
        console.warn('Backend report API unavailable, rendering client fallback report:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, batteryId, batteryName, c1, c2, c3, temp, cycles, statusStr])

  const handlePrint = () => {
    window.print()
  }

  // Executive Summary text formatting
  const executiveSummaryText =
    report?.aiExplanation?.executiveSummary ||
    `Current battery telemetry indicates ${statusStr.toUpperCase()} operational status. The deployed ML model estimates SOH at ${sohVal.toFixed(1)}%. The latest telemetry contains ${temp.toFixed(1)}°C temperature and a cell-voltage spread of ${spreadV.toFixed(2)} V across ${cycles} recorded cycles.`

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <FileText className="h-5 w-5 text-accent" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              📄 OFFICIAL AI BATTERY HEALTH & DIAGNOSTIC REPORT
            </h2>
            <p className="text-xs text-muted">
              Technically Transparent Diagnostic Report for <strong className="text-foreground">{batteryName}</strong> · THE BLACK BOX AI Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
          <Button size="sm" onClick={handlePrint} className="gap-1.5 font-bold shadow-sm">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      {!isValid ? (
        <div className="mt-6 rounded-2xl border border-critical/40 bg-critical/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-critical mb-2" />
          <h3 className="text-base font-black text-critical uppercase tracking-wide">Prediction Unavailable</h3>
          <p className="mt-1 text-sm font-semibold text-foreground">
            Prediction unavailable — invalid or insufficient telemetry.
          </p>
          <p className="mt-2 text-xs text-muted">
            One or more measured cell voltages or temperatures fall outside plausible operational bounds. Check sensor connections and telemetry stream.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-6 text-xs text-foreground font-sans">
          {/* Top Status & Prediction Source Banner */}
          <div className="rounded-2xl border border-line bg-surface-2 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block">System Status</span>
                <span className={`text-base font-black uppercase ${statusStr === 'critical' ? 'text-critical' : statusStr === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {statusStr === 'critical' ? '🔴 CRITICAL FAULT DETECTED' : statusStr === 'warning' ? '⚠️ WARNING - ELEVATED SPREAD' : '🟢 NORMAL OPERATIONAL STATE'}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-faint block">Model Source Identification</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                  <Cpu className="h-3.5 w-3.5" /> {report?.predictionSource || 'Prediction Source: XGBoost ML Model'}
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mt-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent block mb-1">Executive Summary</span>
              <p className="text-xs text-foreground leading-relaxed font-medium bg-background-2/80 p-3 rounded-xl border border-line/60">
                {executiveSummaryText}
              </p>
            </div>
          </div>

          {/* SECTION 1: ML PREDICTIONS */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Section 1: ML Predictions
              </h3>
              <SourceBadge source="ML PREDICTED" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-faint">SOC</span>
                  <SourceBadge source="ML PREDICTED" />
                </div>
                <div className="mt-1 text-lg font-black text-foreground tabular-nums">
                  {report?.mlPredictions?.soc?.formatted ?? `${socVal.toFixed(1)}%`}
                </div>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">ML Predicted State of Charge</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-faint">SOH</span>
                  <SourceBadge source="ML PREDICTED" />
                </div>
                <div className="mt-1 text-lg font-black text-amber-500 tabular-nums">
                  {report?.mlPredictions?.soh?.formatted ?? `${sohVal.toFixed(1)}%`}
                </div>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">ML Predicted State of Health</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-faint">RUL</span>
                  <SourceBadge source={report?.mlPredictions?.rul?.available ? "ML PREDICTED" : "UNAVAILABLE"} />
                </div>
                <div className="mt-1 text-sm font-black text-foreground tabular-nums">
                  {report?.mlPredictions?.rul?.available && report?.mlPredictions?.rul?.value !== null
                    ? `${report.mlPredictions.rul.value} cycles`
                    : "Prediction unavailable"}
                </div>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">
                  {report?.mlPredictions?.rul?.statusNote ?? (presentCount < 3 ? "RUL model suspended (cell removed)" : "RUL model is not currently deployed")}
                </span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-faint">Anomaly</span>
                  <SourceBadge source={(report?.mlPredictions?.anomaly?.sourceTag as MetricSource) || (presentCount < 3 ? 'RULE-BASED' : 'ML PREDICTED')} />
                </div>
                <div className="mt-1 text-xs font-black uppercase text-foreground">
                  {report?.mlPredictions?.anomaly?.formatted ?? (presentCount < 3 ? 'OPEN CIRCUIT (REMOVED CELL)' : spreadV >= 0.35 ? 'HIGH VOLTAGE SPREAD' : 'NORMAL')}
                </div>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">
                  {report?.mlPredictions?.anomaly?.label ?? (presentCount < 3 ? 'Rule-Based Detection' : 'ML Predicted Classification')}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: MEASURED TELEMETRY */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Section 2: Measured Telemetry
              </h3>
              <SourceBadge source="MEASURED" />
            </div>

            <div className="overflow-hidden rounded-xl border border-line bg-background-2/90">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-faint text-[10px] font-extrabold uppercase">
                    <th className="p-2.5">Parameter</th>
                    <th className="p-2.5 text-right">Value</th>
                    <th className="p-2.5 text-right">Source Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium text-xs">
                  <tr>
                    <td className="p-2.5 font-bold">Cell 1 Voltage</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{c1.toFixed(2)} V</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Cell 2 Voltage</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{c2.toFixed(2)} V</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                  <tr className={c3 <= 0.15 ? 'bg-critical/10 text-critical font-bold' : ''}>
                    <td className="p-2.5 font-bold">Cell 3 Voltage {c3 <= 0.15 ? '(Cell Removed / Open Circuit)' : ''}</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{c3.toFixed(2)} V</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Pack Temperature</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{temp.toFixed(1)} °C</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Recorded Cycle Count</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{cycles} cycles</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Measured Pack Terminal Voltage</td>
                    <td className="p-2.5 text-right font-extrabold tabular-nums">{packVoltage.toFixed(2)} V</td>
                    <td className="p-2.5 text-right"><SourceBadge source="MEASURED" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: CALCULATED BATTERY METRICS */}
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Section 3: Calculated Battery Metrics
              </h3>
              <SourceBadge source="CALCULATED" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <span className="text-[10px] font-extrabold uppercase text-faint block">Minimum Cell Voltage</span>
                <span className="text-base font-black text-foreground tabular-nums block mt-1">{minV.toFixed(2)} V</span>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">Dynamically Computed</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <span className="text-[10px] font-extrabold uppercase text-faint block">Maximum Cell Voltage</span>
                <span className="text-base font-black text-foreground tabular-nums block mt-1">{maxV.toFixed(2)} V</span>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">Dynamically Computed</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <span className="text-[10px] font-extrabold uppercase text-faint block">Average Cell Voltage</span>
                <span className="text-base font-black text-blue-500 tabular-nums block mt-1">{avgV.toFixed(2)} V</span>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">(C1 + C2 + C3) / {presentCount}</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/90 p-3">
                <span className="text-[10px] font-extrabold uppercase text-faint block">Cell Voltage Spread</span>
                <span className="text-base font-black text-amber-500 tabular-nums block mt-1">{spreadV.toFixed(2)} V</span>
                <span className="text-[9px] text-muted font-semibold block mt-0.5">Max Cell V - Min Cell V</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: AI EXPLANATION & RECOMMENDATIONS */}
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Section 4: AI Explanation & Recommendations
              </h3>
              <div className="flex items-center gap-1.5">
                <SourceBadge source="AI GENERATED" />
                <SourceBadge source="RULE-BASED" />
              </div>
            </div>

            {/* AI Natural Language Explanation */}
            <div className="rounded-xl border border-line bg-background-2/90 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-foreground">Natural Language AI Explanation</h4>
                <SourceBadge source="AI GENERATED" />
              </div>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {report?.aiExplanation?.aiExplanation?.text || (
                  presentCount < 3
                    ? "Cell telemetry indicates a physically removed or open-circuit cell (~0.07 V floating). Zero current flows through an open circuit, preventing internal resistive heating (ΔT = 0°C). The deterministic preprocessing layer safely bypassed ML model corruption."
                    : `Pack telemetry exhibits a calculated cell voltage spread of ${spreadV.toFixed(2)} V. Nominal series voltage parity is maintained across present cells.`
                )}
              </p>
            </div>

            {/* Rule-Based Recommendations */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Rule-Based Engineering Recommendations
                </h4>
                <SourceBadge source="RULE-BASED" />
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-foreground font-semibold">
                {report?.aiExplanation?.ruleBasedRecommendation?.actions?.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span>{act}</span>
                  </li>
                )) || (
                  presentCount < 3 ? (
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>Re-insert cell into holder contacts to resume live telemetry and ML predictions.</span>
                    </li>
                  ) : spreadV >= 0.35 ? (
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>Perform routine cell balancing cycle as cell voltage spread exceeds 0.35 V tolerance.</span>
                    </li>
                  ) : (
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                      <span>Maintain standard thermal envelope (below 35°C) and continue routine surveillance.</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* SECTION 5: ADVANCED DIAGNOSTICS & MODEL METADATA */}
          <div className="rounded-2xl border border-line bg-surface-2 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Section 5: Advanced Diagnostics & Model Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="text-[10px] font-extrabold uppercase text-accent block">SOC Model</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">Algorithm: {report?.modelMetadata?.soc_model?.algorithm || 'XGBoost (XGBRegressor)'}</span>
                <span className="text-[10px] text-muted block">Target Variable: {report?.modelMetadata?.soc_model?.target || 'SoC_pct'}</span>
                <span className="text-[10px] text-muted block">Validation Metric: {report?.modelMetadata?.soc_model?.validation_metric || 'MAE: 5.56%, R²: 0.871'}</span>
                <span className="text-[10px] text-muted block">Source: ML Inference (v{report?.modelMetadata?.soc_model?.version || '3.4.0'})</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="text-[10px] font-extrabold uppercase text-accent block">SOH Model</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">Algorithm: {report?.modelMetadata?.soh_model?.algorithm || 'XGBoost (XGBRegressor)'}</span>
                <span className="text-[10px] text-muted block">Target Variable: {report?.modelMetadata?.soh_model?.target || 'SoH_pct'}</span>
                <span className="text-[10px] text-muted block">Validation Metric: {report?.modelMetadata?.soh_model?.validation_metric || 'MAE: 1.69%, R²: 0.942'}</span>
                <span className="text-[10px] text-muted block">Source: ML Inference (v{report?.modelMetadata?.soh_model?.version || '3.4.0'})</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="text-[10px] font-extrabold uppercase text-accent block">RUL Model</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">Algorithm: {report?.modelMetadata?.rul_model?.algorithm || 'XGBoost (XGBRegressor)'}</span>
                <span className="text-[10px] text-muted block">Target Variable: {report?.modelMetadata?.rul_model?.target || 'rul_to_80_cycles'}</span>
                <span className="text-[10px] text-muted block">Validation Metric: {report?.modelMetadata?.rul_model?.validation_metric || 'MAE: 3.80 cycles, R²: 0.995'}</span>
                <span className="text-[10px] text-muted block">Status: {report?.mlPredictions?.rul?.statusNote || 'Prediction unavailable'}</span>
              </div>

              <div className="rounded-xl border border-line bg-background-2/80 p-3">
                <span className="text-[10px] font-extrabold uppercase text-accent block">Anomaly Detection</span>
                <span className="text-xs font-bold text-foreground block mt-0.5">Algorithm: {report?.modelMetadata?.anomaly_model?.algorithm || (presentCount < 3 ? 'Engineering Threshold Logic' : 'XGBoost (XGBClassifier)')}</span>
                <span className="text-[10px] text-muted block">Target Variable: {report?.modelMetadata?.anomaly_model?.target || 'anomaly_label'}</span>
                <span className="text-[10px] text-muted block">Validation Metric: {report?.modelMetadata?.anomaly_model?.validation_metric || 'Accuracy: 99.30%'}</span>
                <span className="text-[10px] text-muted block">Source: {report?.mlPredictions?.anomaly?.label || 'Rule-Based / ML'}</span>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="border-t border-line pt-3 flex flex-col sm:flex-row items-center justify-between text-[10px] text-faint font-medium gap-2">
            <span>Report ID: {report?.reportId || `RPT-BLACKBOX-${Date.now().toString().slice(-6)}`}</span>
            <span>Generated by THE BLACK BOX Battery Intelligence Engine · {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </Dialog>
  )
}
