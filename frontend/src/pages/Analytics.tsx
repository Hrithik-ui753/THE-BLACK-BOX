import { useEffect, useMemo, useState } from 'react'
import {
  Cpu,
  Brain,
  FileText,
  AlertOctagon,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Thermometer,
  Layers,
  LayoutGrid,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { usePack, usePackHistory } from '@/hooks/usePack'
import { PlotlyChart } from '@/components/analytics/PlotlyChart'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/states/States'
import { NewAnalyticsModal } from '@/components/analytics/NewAnalyticsModal'
import { CellImbalanceAnalytics } from '@/components/analytics/CellImbalanceAnalytics'
import { ThermalRiskPrediction } from '@/components/analytics/ThermalRiskPrediction'
import { AiAnomalyDetection } from '@/components/analytics/AiAnomalyDetection'
import { SohDegradationPrediction } from '@/components/analytics/SohDegradationPrediction'
import { ThreeCellVisualization } from '@/components/analytics/ThreeCellVisualization'
import { VoltageDegradationGraph } from '@/components/analytics/VoltageDegradationGraph'
import { AiBatteryReasoning } from '@/components/analytics/AiBatteryReasoning'
import { PredictiveFailureAnalysis } from '@/components/analytics/PredictiveFailureAnalysis'
import { BatteryReportModal } from '@/components/analytics/BatteryReportModal'
import { CHART_AXIS, downsample } from '@/utils/chartOptions'
import type { PackTelemetry } from '@/types'

type TimeWindow = '24h' | '7d' | '30d'
const TIME_OPTIONS: Array<{ value: TimeWindow; label: string }> = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

type AnalyticsTab = 'topology' | 'imbalance' | 'ai_reasoning' | 'thermal_soh' | 'plotly_3d' | 'all_grid'

function useWindowed(batteryId: string | undefined, window: TimeWindow): { history: PackTelemetry[]; labels: string[] } {
  const raw = usePackHistory(batteryId)
  return useMemo(() => {
    const down = downsample(raw ?? [], 300)
    if (!down || down.length === 0) return { history: [], labels: [] }
    const span = window === '24h' ? 24 * 60 : window === '7d' ? 7 * 24 * 60 : 30 * 24 * 60
    const step = span / Math.max(down.length - 1, 1)
    const labels = down.map((h, i) => {
      if (!h || !h.timestamp) return `Point ${i + 1}`
      const mins = Math.round(i * step)
      if (window === '24h') return new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `${Math.floor(mins / 60 / 24)}d ${Math.floor((mins % 1440) / 60)}h`
    })
    return { history: down, labels }
  }, [raw, window])
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border border-line bg-surface/90 shadow-md backdrop-blur-sm">
      <CardHeader className="pb-2 border-b border-line/50">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-muted">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}

export function Analytics() {
  const batteries = useAppStore((s) => s.batteries)
  const selectedBatteryId = useAppStore((s) => s.selectedBatteryId)
  const [batteryId, setBatteryId] = useState(selectedBatteryId || batteries[0]?.id || 'battery-01')
  const [window, setWindow] = useState<TimeWindow>('24h')
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('all_grid')

  const [newModalOpen, setNewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [useBenchmarkMode, setUseBenchmarkMode] = useState(false)

  // Modal view for individual expanded module
  const [fullscreenModuleId, setFullscreenModuleId] = useState<number | null>(null)

  useEffect(() => {
    void import('@/services/telemetry/telemetryService').then(({ telemetryService }) => {
      telemetryService.start()
    })
  }, [])

  useEffect(() => {
    if (selectedBatteryId && batteries.some((b) => b.id === selectedBatteryId)) {
      setBatteryId(selectedBatteryId)
    } else if (batteries.length > 0 && (!batteryId || !batteries.some((b) => b.id === batteryId))) {
      setBatteryId(batteries[0].id)
    }
  }, [batteries, batteryId, selectedBatteryId])

  const { history, labels } = useWindowed(batteryId, window)
  const battery = batteries.find((b) => b.id === batteryId) ?? batteries[0]
  const livePack = usePack(batteryId)

  // 3-Cell Benchmark vs Live telemetry
  const pack: PackTelemetry = useMemo(() => {
    if (!useBenchmarkMode && livePack) return livePack
    if (livePack && !useBenchmarkMode) return livePack
    return {
      batteryId: battery?.id ?? 'battery-01',
      timestamp: Date.now(),
      voltage: 8.30,
      current: 12.4,
      temperature: 48.0,
      soc: 76.0,
      soh: 76.0,
      cycleCount: 142,
      status: 'critical',
      chargeState: 'discharging',
      cells: [
        { index: 1, voltage: 3.60, temperature: 38.2, soc: 92.0, soh: 95.0, current: 12.4, status: 'healthy', deviation: 0, risk: 0.05, gas: 0 },
        { index: 2, voltage: 3.60, temperature: 38.5, soc: 92.0, soh: 95.0, current: 12.4, status: 'healthy', deviation: 0, risk: 0.05, gas: 0 },
        { index: 3, voltage: 1.10, temperature: 48.0, soc: 40.0, soh: 60.0, current: 12.4, status: 'critical', deviation: -250, risk: 0.94, gas: 45 },
      ],
    }
  }, [useBenchmarkMode, livePack, battery])

  if (!battery || !pack) return <LoadingState message="Loading 3-cell analytics hardware model..." />

  const cell1V = pack.cells?.[0]?.voltage ?? 3.799
  const cell2V = pack.cells?.[1]?.voltage ?? 3.555
  const cell3V = pack.cells?.[2]?.voltage ?? 3.391
  const maxCellV = Math.max(cell1V, cell2V, cell3V)
  const minCellV = Math.min(cell1V, cell2V, cell3V)
  const minCellIndex = [cell1V, cell2V, cell3V].indexOf(minCellV) + 1
  const imbalanceV = Math.abs(maxCellV - minCellV)
  
  const isCriticalFault = minCellV <= 2.50 || (pack.status === 'critical' && minCellV <= 2.80)
  const isWarningState = !isCriticalFault && (imbalanceV > 0.30 || pack.status === 'warning')
  const anomalyScore = isCriticalFault ? 94 : isWarningState ? 42 : Math.min(85, Math.round(imbalanceV * 80 + 8))

  const cellSeries = useMemo(() => {
    const cells = pack.cells?.length ?? battery?.cellCount ?? 3
    return Array.from({ length: cells }, (_, i) => {
      const color = ['#38bdf8', '#34d399', '#ef4444', '#fbbf24', '#a78bfa', '#ec4899'][i % 6]
      const currentV = pack.cells?.[i]?.voltage ?? 3.7
      return {
        name: `Cell ${String(i + 1).padStart(2, '0')}`,
        color,
        data: history.length > 0 ? history.map((h) => h.cells?.[i]?.voltage ?? currentV) : [currentV, currentV, currentV, currentV],
      }
    })
  }, [history, battery, pack])

  const cell1Data = history.length > 0 ? history.map((h) => h.cells?.[0]?.voltage ?? cell1V) : [cell1V, cell1V, cell1V, cell1V]
  const cell2Data = history.length > 0 ? history.map((h) => h.cells?.[1]?.voltage ?? cell2V) : [cell2V, cell2V, cell2V, cell2V]
  const cell3Data = history.length > 0 ? history.map((h) => h.cells?.[2]?.voltage ?? cell3V) : [cell3V, cell3V, cell3V, cell3V]

  const modulesList = [
    {
      id: 1,
      category: 'topology' as const,
      title: 'Hardware Topology & 3-Cell Voltage Breakdown',
      subtitle: 'Cell 1, Cell 2, Cell 3 individual voltage breakdown with cell presence & balance status.',
      badge: (cell1V <= 0.15 || cell2V <= 0.15 || cell3V <= 0.15) ? 'Cell Removed 🔌' : isCriticalFault ? `Critical Voltage (${minCellV.toFixed(2)}V)` : isWarningState ? `Warning (${imbalanceV.toFixed(2)}V ΔV)` : 'Balanced & Healthy',
      badgeColor: (cell1V <= 0.15 || cell2V <= 0.15 || cell3V <= 0.15) ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : isCriticalFault ? 'bg-critical/20 text-critical border-critical/30' : isWarningState ? 'bg-warning/20 text-warning border-warning/30' : 'bg-healthy/20 text-healthy border-healthy/30',
      component: <ThreeCellVisualization cell1V={cell1V} cell2V={cell2V} cell3V={cell3V} pack={pack} />,
    },
    {
      id: 2,
      category: 'topology' as const,
      title: 'Voltage Degradation & Discharge Trajectory',
      subtitle: 'Comparative voltage discharge trajectory per cell over time.',
      badge: 'Live Trajectory',
      badgeColor: 'bg-warning/20 text-warning border-warning/30',
      component: (
        <VoltageDegradationGraph
          timeLabels={labels.length > 0 ? labels : ['Point 1', 'Point 2', 'Point 3', 'Point 4']}
          cell1Data={cell1Data}
          cell2Data={cell2Data}
          cell3Data={cell3Data}
        />
      ),
    },
    {
      id: 3,
      category: 'imbalance' as const,
      title: 'Cell Imbalance & Voltage Variance Analysis',
      subtitle: 'Pack voltage imbalance (ΔV) calculation and cell-to-cell deviation.',
      badge: `ΔV = ${imbalanceV.toFixed(2)} V`,
      badgeColor: imbalanceV > 0.3 ? 'bg-critical/20 text-critical border-critical/30' : 'bg-accent/20 text-accent border-accent/30',
      component: (
        <CellImbalanceAnalytics
          pack={pack}
          historyLabels={labels}
          cellVoltageHistory={cellSeries}
        />
      ),
    },
    {
      id: 8,
      category: 'imbalance' as const,
      title: 'AI Anomaly Detection & Signal Isolation',
      subtitle: 'Statistical anomaly isolation analyzing cell voltage deviations.',
      badge: `Anomaly: ${anomalyScore}/100`,
      badgeColor: anomalyScore > 50 ? 'bg-critical/20 text-critical border-critical/30' : 'bg-healthy/20 text-healthy border-healthy/30',
      component: (
        <AiAnomalyDetection
          score={anomalyScore}
          abnormalBehavior={imbalanceV > 0.3 ? `⚠️ Voltage imbalance ΔV = ${imbalanceV.toFixed(2)} V detected across cells.` : 'All cell voltages and pack parameters within healthy bands.'}
          signals={[
            { label: 'Cell Voltage Spread ΔV', pct: Math.min(100, Math.round(imbalanceV * 150)) },
            { label: 'Thermal Elevation', pct: Math.min(100, Math.round(pack.temperature * 1.5)) },
            { label: 'Gas Sensor Deviation', pct: Math.min(100, Math.round((pack.cells[0]?.gas || 195) / 5)) },
          ]}
        />
      ),
    },
    {
      id: 4,
      category: 'ai_reasoning' as const,
      title: 'Structured AI Battery Safety Reasoning Pipeline',
      subtitle: 'Azure OpenAI gpt-4.1-mini structured reasoning & safety root cause diagnosis.',
      badge: 'Azure OpenAI Live',
      badgeColor: 'bg-accent/20 text-accent border-accent/30',
      component: <AiBatteryReasoning cell1V={cell1V} cell2V={cell2V} cell3V={cell3V} />,
    },
    {
      id: 5,
      category: 'ai_reasoning' as const,
      title: 'Predictive Thermal & Hardware Failure Risk',
      subtitle: 'AI failure risk model predicting thermal runaway and cell damage probability.',
      badge: anomalyScore > 75 ? `Failure Risk: ${anomalyScore}%` : `Low Risk: ${anomalyScore}%`,
      badgeColor: anomalyScore > 75 ? 'bg-critical/20 text-critical border-critical/30' : 'bg-healthy/20 text-healthy border-healthy/30',
      component: <PredictiveFailureAnalysis failureRiskScore={anomalyScore} pack={pack} soh={pack.soh ?? 94.2} rulCycles={Math.max(40, Math.round((pack.soh ?? 94.2) * 2.5))} />,
    },
    {
      id: 6,
      category: 'thermal_soh' as const,
      title: 'Thermal Risk Prediction & Temperature Correlation',
      subtitle: 'Temperature elevation rate and thermal risk correlation model.',
      badge: `${pack.temperature.toFixed(1)} °C`,
      badgeColor: 'bg-warning/20 text-warning border-warning/30',
      component: (
        <ThermalRiskPrediction
          pack={pack}
          riseRate={1.2}
          historyLabels={labels.slice(-8)}
        />
      ),
    },
    {
      id: 7,
      category: 'thermal_soh' as const,
      title: 'SOH Capacity Degradation & Horizon Forecasting',
      subtitle: 'State of Health (SOH) cycle degradation forecasting and lifetime projection.',
      badge: `SOH: ${(pack.soh ?? 90).toFixed(0)}%`,
      badgeColor: 'bg-accent/20 text-accent border-accent/30',
      component: (
        <SohDegradationPrediction
          pack={pack}
          degradationRateWeek={-0.4}
          degradationRateCycle={-0.04}
          cyclesTo70={120}
        />
      ),
    },
    {
      id: 9,
      category: 'plotly_3d' as const,
      title: 'Multivariate 3D Scatter Matrix (Plotly Engine)',
      subtitle: 'WebGL-powered 3D scatter matrix visualizing Voltage × Temp × Time.',
      badge: 'Plotly WebGL 3D',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      component: (
        <ChartCard title="Multivariate 3D Scatter Matrix" subtitle="Voltage × Temperature × Time colored per cell">
          <PlotlyChart
            height={440}
            data={(() => {
              const n = Math.min(3, pack.cells?.length ?? 3)
              const sample = downsample(history.length ? history : [pack, pack], 120)
              return Array.from({ length: n }, (_, i) => ({
                type: 'scatter3d' as const,
                mode: 'lines',
                name: `Cell ${String(i + 1).padStart(2, '0')}`,
                x: sample.map((h) => new Date(h.timestamp || Date.now()).toISOString()),
                y: sample.map((h) => h.cells?.[i]?.voltage ?? (pack.cells?.[i]?.voltage ?? 3.7)),
                z: sample.map((h) => h.cells?.[i]?.temperature ?? pack.temperature ?? 27.14),
                line: { width: 3 },
              }))
            })()}
            layout={{
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: CHART_AXIS, size: 11 },
              margin: { l: 10, r: 10, t: 10, b: 10 },
              colorway: ['#38bdf8', '#34d399', '#f59e0b'],
              scene: {
                xaxis: { title: 'Time', color: CHART_AXIS, gridcolor: 'rgba(26,44,69,0.5)' },
                yaxis: { title: 'Voltage (V)', color: CHART_AXIS, gridcolor: 'rgba(26,44,69,0.5)' },
                zaxis: { title: 'Temperature (°C)', color: CHART_AXIS, gridcolor: 'rgba(26,44,69,0.5)' },
                bgcolor: 'rgba(0,0,0,0)',
              },
            }}
          />
        </ChartCard>
      ),
    },
  ]

  const filteredModules = useMemo(() => {
    if (activeTab === 'all_grid') return modulesList
    return modulesList.filter((m) => m.category === activeTab)
  }, [activeTab, modulesList])

  const tabButtons: Array<{ id: AnalyticsTab; label: string; icon: any; count?: number }> = [
    { id: 'all_grid', label: 'All Modules Grid (Overview)', icon: LayoutGrid, count: 9 },
    { id: 'topology', label: 'Topology & 3-Cell Breakdown', icon: Layers, count: 2 },
    { id: 'imbalance', label: 'Cell Imbalance & Anomaly', icon: Zap, count: 2 },
    { id: 'ai_reasoning', label: 'AI Safety & Reasoning', icon: Brain, count: 2 },
    { id: 'thermal_soh', label: 'Thermal & Degradation', icon: Thermometer, count: 2 },
    { id: 'plotly_3d', label: '3D Matrix', icon: Sparkles, count: 1 },
  ]

  const hasRemovedCell = cell1V <= 0.15 || cell2V <= 0.15 || cell3V <= 0.15
  const removedCellIndices = [
    cell1V <= 0.15 ? 1 : null,
    cell2V <= 0.15 ? 2 : null,
    cell3V <= 0.15 ? 3 : null
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <NewAnalyticsModal open={newModalOpen} onClose={() => setNewModalOpen(false)} />
      <BatteryReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        batteryName={battery.name}
        healthScore={Math.round((pack.soh ?? 90) * (cell3V < 2.5 ? 0.6 : 1.0))}
        sohPct={pack.soh ?? 90}
        overallRisk={hasRemovedCell ? 'CRITICAL' : isCriticalFault ? 'CRITICAL' : isWarningState ? 'HIGH_RISK' : 'LOW'}
        cell1V={cell1V}
        cell2V={cell2V}
        cell3V={cell3V}
      />

      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-line/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15 text-accent shadow-md shadow-accent/10">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                Battery Intelligence & Safety Analytics
              </h1>
              <p className="text-xs text-muted">
                Real-Time 3-Cell Telemetry · Azure OpenAI Safety Pipeline · Predictive Failure Modeling
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Battery Selector */}
          <div className="min-w-[160px]">
            <Select
              value={batteryId}
              onChange={(e) => setBatteryId(e.target.value)}
              aria-label="Select Battery Pack"
            >
              {batteries.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-line bg-surface p-1 shadow-sm text-xs font-bold">
            <button
              onClick={() => setUseBenchmarkMode(false)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                !useBenchmarkMode ? 'bg-accent text-background shadow-md font-extrabold' : 'text-muted hover:text-foreground'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Live
            </button>
            <button
              onClick={() => setUseBenchmarkMode(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                useBenchmarkMode ? 'bg-critical text-white shadow-md font-extrabold' : 'text-muted hover:text-foreground'
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Benchmark (0V Fault)
            </button>
          </div>

          {/* Time Window */}
          <Select value={window} onChange={(e) => setWindow(e.target.value as TimeWindow)} aria-label="Time window">
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>

          {/* PDF Report Export */}
          <Button onClick={() => setReportModalOpen(true)} variant="outline" className="gap-1.5 font-bold text-xs shadow-sm">
            <FileText className="h-4 w-4 text-accent" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Executive System Health Status Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all ${
        hasRemovedCell
          ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-surface text-foreground shadow-amber-500/10'
          : isCriticalFault
          ? 'border-critical/60 bg-gradient-to-r from-critical/20 via-critical/10 to-surface text-foreground shadow-critical/10'
          : isWarningState
          ? 'border-warning/50 bg-gradient-to-r from-warning/20 via-warning/10 to-surface text-foreground'
          : 'border-healthy/40 bg-gradient-to-r from-healthy/15 via-healthy/5 to-surface text-foreground'
      }`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border font-bold ${
              hasRemovedCell
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                : isCriticalFault ? 'border-critical/50 bg-critical/20 text-critical animate-pulse' : isWarningState ? 'border-warning/50 bg-warning/20 text-warning' : 'border-healthy/50 bg-healthy/20 text-healthy'
            }`}>
              {hasRemovedCell ? <AlertTriangle className="h-6 w-6 text-amber-400" /> : isCriticalFault ? <AlertTriangle className="h-6 w-6" /> : isWarningState ? <AlertOctagon className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  hasRemovedCell
                    ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                    : isCriticalFault ? 'border-critical/40 bg-critical/20 text-critical' : isWarningState ? 'border-warning/40 bg-warning/20 text-warning' : 'border-healthy/40 bg-healthy/20 text-healthy'
                }`}>
                  {hasRemovedCell ? '🔌 CELL REMOVED DETECTED' : isCriticalFault ? 'CRITICAL SAFETY FAULT DETECTED' : isWarningState ? 'ELEVATED RISK WARNING' : 'ALL SYSTEMS OPERATIONAL'}
                </span>
                <span className="text-xs font-bold text-muted">
                  Battery ID: {battery.id}
                </span>
              </div>
              <p className="mt-1 text-sm font-extrabold text-foreground">
                {hasRemovedCell
                  ? `🔌 Cell ${removedCellIndices.join(', ')} physically removed / open-circuit (~0.07V). Deterministic validation layer skipped ML inference for removed cell(s).`
                  : isCriticalFault
                  ? `Severe Low Voltage Drop Detected: Cell ${minCellIndex} is operating at ${minCellV.toFixed(2)} V (ΔV = ${imbalanceV.toFixed(2)} V imbalance). Immediate verification & servicing recommended.`
                  : isWarningState
                  ? `Elevated Voltage Imbalance ΔV = ${imbalanceV.toFixed(2)} V across cells. Monitoring cell voltage spread.`
                  : `Pack status healthy. All 3 cells operating within optimal voltage range (${minCellV.toFixed(2)}V - ${maxCellV.toFixed(2)}V).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-line/40 pt-2 sm:pt-0 sm:pl-4">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-muted uppercase">Imbalance ΔV</span>
              <span className={`text-base font-black tabular-nums ${imbalanceV > 0.4 ? 'text-critical' : 'text-foreground'}`}>{imbalanceV.toFixed(2)} V</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-muted uppercase">Health (SOH)</span>
              <span className="text-base font-black text-accent tabular-nums">
                {pack.soh !== null && pack.soh !== undefined ? `${pack.soh.toFixed(0)}%` : '--'}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-muted uppercase">Anomaly Risk</span>
              <span className={`text-base font-black tabular-nums ${anomalyScore > 70 ? 'text-critical' : 'text-healthy'}`}>{anomalyScore}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick 3-Cell Telemetry Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={`rounded-2xl border p-3 shadow-sm transition-all text-center ${cell1V <= 0.15 ? 'border-amber-500/60 bg-amber-500/10' : 'border-line bg-surface/80'}`}>
          <span className="block text-[10px] font-bold uppercase text-muted">Cell 01 Voltage</span>
          <span className="mt-1 block text-lg font-black text-foreground tabular-nums">{cell1V.toFixed(2)} V</span>
          <span className={`mt-0.5 inline-block text-[10px] font-bold ${cell1V <= 0.15 ? 'text-amber-400 font-extrabold' : 'text-healthy'}`}>
            {cell1V <= 0.15 ? 'REMOVED 🔌' : 'HEALTHY'}
          </span>
        </div>
        <div className={`rounded-2xl border p-3 shadow-sm transition-all text-center ${cell2V <= 0.15 ? 'border-amber-500/60 bg-amber-500/10' : 'border-line bg-surface/80'}`}>
          <span className="block text-[10px] font-bold uppercase text-muted">Cell 02 Voltage</span>
          <span className="mt-1 block text-lg font-black text-foreground tabular-nums">{cell2V.toFixed(2)} V</span>
          <span className={`mt-0.5 inline-block text-[10px] font-bold ${cell2V <= 0.15 ? 'text-amber-400 font-extrabold' : 'text-healthy'}`}>
            {cell2V <= 0.15 ? 'REMOVED 🔌' : 'HEALTHY'}
          </span>
        </div>
        <div className={`rounded-2xl border p-3 shadow-sm transition-all text-center ${cell3V <= 0.15 ? 'border-amber-500/60 bg-amber-500/10' : cell3V < 2.5 ? 'border-critical/60 bg-critical/15 text-critical animate-pulse' : 'border-line bg-surface/80'}`}>
          <span className="block text-[10px] font-bold uppercase">Cell 03 Voltage</span>
          <span className="mt-1 block text-lg font-black tabular-nums">{cell3V.toFixed(2)} V</span>
          <span className={`mt-0.5 inline-block text-[10px] font-black uppercase ${cell3V <= 0.15 ? 'text-amber-400 font-extrabold' : cell3V < 2.5 ? 'text-critical' : 'text-healthy'}`}>
            {cell3V <= 0.15 ? 'REMOVED 🔌' : cell3V < 2.5 ? 'CRITICAL FAULT' : 'HEALTHY'}
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-surface/80 p-3 shadow-sm transition-all hover:border-accent/30 text-center">
          <span className="block text-[10px] font-bold uppercase text-muted">Spread Imbalance</span>
          <span className={`mt-1 block text-lg font-black tabular-nums ${imbalanceV > 0.4 ? 'text-critical' : 'text-accent'}`}>{imbalanceV.toFixed(2)} V</span>
          <span className="mt-0.5 inline-block text-[10px] font-bold text-muted">Max ΔV</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface/80 p-3 shadow-sm transition-all hover:border-accent/30 text-center">
          <span className="block text-[10px] font-bold uppercase text-muted">Pack Temperature</span>
          <span className="mt-1 block text-lg font-black text-warning tabular-nums">{pack.temperature.toFixed(1)}°C</span>
          <span className="mt-0.5 inline-block text-[10px] font-bold text-muted">Nominal</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface/80 p-3 shadow-sm transition-all hover:border-accent/30 text-center col-span-2 sm:col-span-1">
          <span className="block text-[10px] font-bold uppercase text-muted">State of Health</span>
          <span className="mt-1 block text-lg font-black text-accent tabular-nums">
            {pack.soh !== null && pack.soh !== undefined ? `${pack.soh.toFixed(0)}%` : '--'}
          </span>
          <span className="mt-0.5 inline-block text-[10px] font-bold text-muted">SOH Capacity</span>
        </div>
      </div>

      {/* Category Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line/60 pb-2 scrollbar-none">
        {tabButtons.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 ${
                isActive
                  ? 'bg-accent text-background shadow-md shadow-accent/20'
                  : 'bg-surface/80 text-muted hover:bg-surface hover:text-foreground border border-line/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${isActive ? 'bg-background/20 text-background' : 'bg-line/60 text-muted'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Analytics Module Cards Display */}
      <div className={activeTab === 'all_grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
        {filteredModules.map((item) => (
          <div
            key={item.id}
            onClick={() => setFullscreenModuleId(item.id)}
            className="group relative rounded-3xl border border-line/80 bg-surface/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-[1.008] hover:border-accent/60 hover:shadow-xl hover:shadow-accent/10 cursor-pointer"
          >
            {/* Module Card Top Header */}
            <div className="flex items-center justify-between border-b border-line/50 p-4.5 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent font-black text-xs shadow-sm">
                  #{item.id}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-black text-foreground group-hover:text-accent transition-colors">{item.title}</h2>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-black text-accent opacity-80 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3 w-3" /> Full View
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFullscreenModuleId(fullscreenModuleId === item.id ? null : item.id)
                  }}
                  className="h-8 w-8 p-0 text-muted hover:text-accent group-hover:text-accent"
                  title="Open Full Page Module"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Module Content */}
            <div className="p-4 pt-3">
              {item.component}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Fullscreen Page View for Individual Module */}
      {fullscreenModuleId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setFullscreenModuleId(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border-2 border-accent/40 bg-surface/95 p-6 sm:p-8 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-accent/40 bg-accent/20 text-accent font-black text-sm shadow-md">
                  #{fullscreenModuleId}
                </span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-black text-foreground">
                      {modulesList.find((m) => m.id === fullscreenModuleId)?.title}
                    </h2>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-black ${modulesList.find((m) => m.id === fullscreenModuleId)?.badgeColor}`}>
                      {modulesList.find((m) => m.id === fullscreenModuleId)?.badge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-muted mt-0.5">
                    {modulesList.find((m) => m.id === fullscreenModuleId)?.subtitle}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreenModuleId(null)}
                className="gap-2 font-black text-xs border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-background transition-all shadow-md"
              >
                <Minimize2 className="h-4 w-4" /> Close Page View
              </Button>
            </div>

            {/* Modal Content */}
            <div className="pt-2">
              {modulesList.find((m) => m.id === fullscreenModuleId)?.component}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
