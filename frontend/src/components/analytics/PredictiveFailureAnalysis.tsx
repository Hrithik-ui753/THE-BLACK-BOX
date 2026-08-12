import { AlertTriangle, ArrowDown, Flame, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface PredictiveFailureAnalysisProps {
  failureRiskScore?: number
}

export function PredictiveFailureAnalysis({
  failureRiskScore = 92,
}: PredictiveFailureAnalysisProps) {
  const isHighRisk = failureRiskScore > 50

  const progressionSteps = isHighRisk
    ? [
        { stage: 'Current Condition', desc: 'Cell voltage imbalance or deviation detected', style: 'border-slate-700 bg-slate-900 text-slate-200' },
        { stage: 'Localized Degradation', desc: 'Accelerated capacity loss & ESR spike', style: 'border-amber-500/40 bg-amber-950/40 text-amber-300' },
        { stage: 'Increasing Imbalance', desc: 'Pack ΔV widens beyond safe cutoff', style: 'border-orange-500/40 bg-orange-950/40 text-orange-300' },
        { stage: 'Constrained Energy', desc: 'Pack output constrained by weakest cell', style: 'border-rose-500/40 bg-rose-950/40 text-rose-300' },
        { stage: 'Potential Instability', desc: 'Elevated thermal runaway hazard score', style: 'border-critical bg-critical/20 text-critical shadow-lg ring-1 ring-critical/40' },
      ]
    : [
        { stage: 'Normal State', desc: 'All cell voltages balanced & stable', style: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' },
        { stage: 'Thermal Stability', desc: 'Pack temperature within nominal band', style: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' },
        { stage: 'Low Resistance', desc: 'Minimal internal resistance growth', style: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' },
        { stage: 'Optimal Capacity', desc: 'Full capacity utilization across cells', style: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300' },
        { stage: 'Healthy Profile', desc: 'Low degradation probability score', style: 'border-healthy bg-healthy/20 text-healthy shadow-sm' },
      ]

  const keyFactors = isHighRisk
    ? [
        'Cell voltage deviation detected',
        'Imbalance slope expansion rate',
        'Elevated pack operating temperature',
        'Abnormal cell response under load',
      ]
    : [
        'Nominal cell voltage balance (<30 mV ΔV)',
        'Optimal thermal dissipation envelope',
        'Stable internal impedance profile',
        'High SOH maintenance trajectory',
      ]

  return (
    <Card className="border border-line bg-surface p-6 shadow-panel">
      <CardHeader className="p-0 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${isHighRisk ? 'border-critical/30 bg-critical/10' : 'border-healthy/30 bg-healthy/10'}`}>
              <Flame className={`h-4.5 w-4.5 ${isHighRisk ? 'text-critical' : 'text-healthy'}`} />
            </span>
            <div>
              <CardTitle className="text-base font-black tracking-tight text-foreground">
                5. 🔥 PREDICTIVE FAILURE ANALYSIS & CONSEQUENCE PROGRESSION
              </CardTitle>
              <p className="text-xs text-muted">Predictive failure risk model & cascading degradation pathway</p>
            </div>
          </div>

          <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2 font-black shadow-sm ${isHighRisk ? 'border-critical bg-critical/10 text-critical' : 'border-healthy bg-healthy/10 text-healthy'}`}>
            <ShieldAlert className="h-5 w-5" />
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-wider opacity-80">Failure Risk</span>
              <span className="text-sm font-black tabular-nums">{failureRiskScore} / 100 — {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        {/* Contributing Risk Factors List */}
        <div className={`rounded-2xl border p-4 ${isHighRisk ? 'border-critical/30 bg-critical/5' : 'border-healthy/30 bg-healthy/5'}`}>
          <span className={`block text-xs font-black uppercase tracking-wider mb-2 ${isHighRisk ? 'text-critical' : 'text-healthy'}`}>
            Key Operating Risk Factors:
          </span>
          <div className="grid gap-2 sm:grid-cols-2 text-xs font-bold text-foreground">
            {keyFactors.map((factor, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-xl border border-line bg-background-2/80 px-3 py-2">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${isHighRisk ? 'text-critical' : 'text-healthy'}`} />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Risk Progression Flowchart */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
            Predicted Risk Progression Pathway
          </h4>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-1">
            {progressionSteps.map((step, idx) => (
              <div key={step.stage} className="flex flex-col items-center w-full">
                <div className={`w-full rounded-2xl border p-3.5 text-center transition-all ${step.style}`}>
                  <span className="block text-[10px] font-black uppercase opacity-75">Step 0{idx + 1}</span>
                  <span className="block text-xs font-extrabold mt-0.5">{step.stage}</span>
                  <span className="block text-[9px] font-medium mt-1 opacity-80">{step.desc}</span>
                </div>
                {idx < progressionSteps.length - 1 && (
                  <div className="my-1 sm:hidden">
                    <ArrowDown className="h-4 w-4 text-faint" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
