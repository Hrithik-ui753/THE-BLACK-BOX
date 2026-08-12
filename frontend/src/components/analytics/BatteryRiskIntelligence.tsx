import { ShieldAlert, ShieldCheck, TriangleAlert, Cpu } from 'lucide-react'
import type { PackTelemetry } from '@/types'

export interface RiskIntelligenceProps {
  pack: PackTelemetry
  imbalanceV: number
  anomalyScore: number
  healthScore: number
}

export function BatteryRiskIntelligence({ pack, imbalanceV, anomalyScore, healthScore }: RiskIntelligenceProps) {
  // Determine overall risk
  const isCritical = anomalyScore >= 76 || imbalanceV > 0.20 || pack.temperature > 55
  const isWarning = !isCritical && (anomalyScore >= 51 || imbalanceV > 0.10 || pack.temperature > 45 || healthScore < 75)
  const riskLevel = isCritical ? 'CRITICAL' : isWarning ? 'MEDIUM' : 'LOW'
  const riskBg = isCritical ? 'bg-critical/10 border-critical/40 text-critical' : isWarning ? 'bg-warning/10 border-warning/40 text-warning' : 'bg-healthy/10 border-healthy/40 text-healthy'

  const metrics = [
    {
      label: 'Battery Health',
      value: `${healthScore} / 100`,
      status: healthScore >= 90 ? '🟢 Excellent' : healthScore >= 75 ? '🟢 Good' : healthScore >= 50 ? '🟡 Warning' : '🔴 Critical',
      isSeverity: healthScore < 75,
    },
    {
      label: 'Cell Imbalance (ΔV)',
      value: `${imbalanceV.toFixed(2)} V`,
      status: imbalanceV < 0.05 ? '🟢 Healthy' : imbalanceV <= 0.10 ? '🔵 Watch' : imbalanceV <= 0.20 ? '🟡 Warning' : '🔴 Critical',
      isSeverity: imbalanceV > 0.10,
    },
    {
      label: 'Temperature',
      value: `${pack.temperature.toFixed(1)} °C`,
      status: pack.temperature < 45 ? '🟢 Normal' : pack.temperature <= 55 ? '🟡 Warning' : '🔴 Critical',
      isSeverity: pack.temperature >= 45,
    },
    {
      label: 'Anomaly Score',
      value: `${anomalyScore} / 100`,
      status: anomalyScore <= 20 ? '🟢 Normal' : anomalyScore <= 50 ? '🔵 Minor' : anomalyScore <= 75 ? '🟡 Suspicious' : '🔴 Critical',
      isSeverity: anomalyScore > 50,
    },
    {
      label: 'State of Health (SOH)',
      value: `${pack.soh.toFixed(1)}%`,
      status: pack.soh >= 90 ? '🟢 Healthy' : pack.soh >= 80 ? '🟡 Degrading' : '🔴 Critical',
      isSeverity: pack.soh < 85,
    },
  ]

  return (
    <div className="rounded-3xl border border-line bg-surface/95 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
            <Cpu className="h-5 w-5 text-accent" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-faint">Platform Intelligence</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">LIVE ANALYTICS</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl">🔴 BATTERY RISK INTELLIGENCE</h2>
          </div>
        </div>

        {/* Overall Risk Level Badge */}
        <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 font-black shadow-sm ${riskBg}`}>
          {isCritical ? <ShieldAlert className="h-5 w-5" /> : isWarning ? <TriangleAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">Overall Risk</span>
            <span className="text-sm font-extrabold">{riskLevel}</span>
          </div>
        </div>
      </div>

      {/* KPI Matrix Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line text-[10px] font-extrabold uppercase tracking-wider text-faint">
              <th className="pb-3 font-extrabold">Intelligence Metric</th>
              <th className="pb-3 text-right font-extrabold">Current Value</th>
              <th className="pb-3 text-right font-extrabold">Status & Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50 font-medium">
            {metrics.map((m) => (
              <tr key={m.label} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="py-3 font-bold text-foreground">{m.label}</td>
                <td className="py-3 text-right font-black tabular-nums text-foreground">{m.value}</td>
                <td className="py-3 text-right">
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold tabular-nums ${m.isSeverity ? 'bg-slate-100 text-foreground dark:bg-slate-800' : 'text-muted'}`}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Assessment Conclusion */}
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-xs">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-black text-[11px]">
          AI
        </span>
        <div>
          <span className="block font-extrabold tracking-wide text-accent-soft">AI Executive Assessment Conclusion</span>
          <p className="mt-1 leading-relaxed text-muted">
            {isCritical
              ? `⚠️ Critical attention required: Cell imbalance (ΔV = ${imbalanceV.toFixed(2)} V) and high anomaly score (${anomalyScore}/100) indicate immediate thermal or electrical risk.`
              : isWarning
              ? `⚡ Battery health is ${healthScore >= 75 ? 'GOOD' : 'FAIR'} overall, but Cell imbalance (ΔV = ${imbalanceV.toFixed(2)} V) and elevated thermal trends require close monitoring.`
              : `🟢 All primary indicators are stable. Electrical stability, thermal bounds, and cell balancing remain within optimal operating windows.`}
          </p>
        </div>
      </div>
    </div>
  )
}
