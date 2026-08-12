import { useEffect, useMemo, useState } from 'react'
import { Cpu, Brain, FileText, AlertOctagon, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react'
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
import {
  CHART_AXIS,
  downsample,
} from '@/utils/chartOptions'
import type { PackTelemetry } from '@/types'

type TimeWindow = '24h' | '7d' | '30d'
const TIME_OPTIONS: Array<{ value: TimeWindow; label: string }> = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
]

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
    <Card className="border border-line bg-surface shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs text-muted">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function Analytics() {
  const batteries = useAppStore((s) => s.batteries)
  const selectedBatteryId = useAppStore((s) => s.selectedBatteryId)
  const [batteryId, setBatteryId] = useState(selectedBatteryId || batteries[0]?.id || 'battery-01')
  const [window, setWindow] = useState<TimeWindow>('24h')

  const [newModalOpen, setNewModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [useBenchmarkMode, setUseBenchmarkMode] = useState(false)

  // Track expanded accordion items (default expand #1, #2, #3, #4)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  })

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const expandAll = () => {
    const all: Record<number, boolean> = {}
    for (let i = 1; i <= 9; i++) all[i] = true
    setExpandedItems(all)
  }

  const collapseAll = () => {
    setExpandedItems({})
  }

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
  const imbalanceV = Math.abs(Math.max(cell1V, cell2V, cell3V) - Math.min(cell1V, cell2V, cell3V))
  
  const anomalyScore = pack.status === 'critical' ? 94 : pack.status === 'warning' ? 52 : Math.min(95, Math.round(imbalanceV * 120 + 8))

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

  const analyticsModules = [
    {
      id: 1,
      title: 'Hardware Topology & 3-Cell Voltage Breakdown',
      subtitle: 'Cell 1, Cell 2, Cell 3 individual voltage breakdown with cell balance status.',
      badge: pack.status === 'critical' ? `Critical Voltage (${cell3V.toFixed(2)}V)` : pack.status === 'warning' ? `Warning (${imbalanceV.toFixed(2)}V ΔV)` : 'Balanced & Healthy',
      badgeColor: pack.status === 'critical' ? 'bg-critical/20 text-critical border-critical/30' : pack.status === 'warning' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-healthy/20 text-healthy border-healthy/30',
      component: <ThreeCellVisualization cell1V={cell1V} cell2V={cell2V} cell3V={cell3V} />,
    },
    {
      id: 2,
      title: 'Voltage Degradation & Discharge Curve',
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
      id: 4,
      title: 'Structured AI Battery Safety Reasoning Pipeline',
      subtitle: 'Azure OpenAI gpt-4.1-mini structured reasoning & safety root cause diagnosis.',
      badge: 'Azure OpenAI Live',
      badgeColor: 'bg-accent/20 text-accent border-accent/30',
      component: <AiBatteryReasoning cell1V={cell1V} cell2V={cell2V} cell3V={cell3V} />,
    },
    {
      id: 5,
      title: 'Predictive Thermal & Hardware Failure Risk',
      subtitle: 'AI failure risk model predicting thermal runaway and cell damage probability.',
      badge: anomalyScore > 75 ? `Failure Risk: ${anomalyScore}%` : `Low Risk: ${anomalyScore}%`,
      badgeColor: anomalyScore > 75 ? 'bg-critical/20 text-critical border-critical/30' : 'bg-healthy/20 text-healthy border-healthy/30',
      component: <PredictiveFailureAnalysis failureRiskScore={anomalyScore} />,
    },
    {
      id: 6,
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
      title: 'SOH Capacity Degradation & Horizon Forecasting',
      subtitle: 'State of Health (SOH) cycle degradation forecasting and lifetime projection.',
      badge: `SOH: ${pack.soh.toFixed(0)}%`,
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
      id: 8,
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
      id: 9,
      title: 'Multivariate 3D Scatter Matrix (Plotly Engine)',
      subtitle: 'WebGL-powered 3D scatter matrix visualizing Voltage × Temp × Time.',
      badge: 'Plotly WebGL 3D',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      component: (
        <ChartCard title="Multivariate 3D Scatter Matrix" subtitle="Voltage × Temperature × Time colored per cell">
          <PlotlyChart
            height={420}
            data={(() => {
              const n = pack.cells?.length ?? 3
              const sample = downsample(history.length ? history : [pack, pack], 120)
              return Array.from({ length: n }, (_, i) => ({
                type: 'scatter3d' as const,
                mode: 'lines',
                name: `Cell ${String(i + 1).padStart(2, '0')}`,
                x: sample.map((h) => new Date(h.timestamp || Date.now()).toISOString()),
                y: sample.map((h) => h.cells?.[i]?.voltage ?? (pack.cells?.[i]?.voltage ?? 3.7)),
                z: sample.map((h) => h.cells?.[i]?.temperature ?? pack.temperature ?? 27.14),
                line: { width: 2.5 },
              }))
            })()}
            layout={{
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: CHART_AXIS, size: 11 },
              margin: { l: 10, r: 10, t: 10, b: 10 },
              colorway: ['#38bdf8', '#34d399', '#ef4444', '#fbbf24', '#a78bfa', '#ec4899'],
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <NewAnalyticsModal open={newModalOpen} onClose={() => setNewModalOpen(false)} />
      <BatteryReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        batteryName={battery.name}
        healthScore={Math.round(pack.soh * (cell3V < 2.5 ? 0.6 : 1.0))}
        sohPct={pack.soh}
        overallRisk={cell3V < 2.5 ? "CRITICAL" : "LOW"}
        cell1V={cell1V}
        cell2V={cell2V}
        cell3V={cell3V}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
              <Cpu className="h-4.5 w-4.5 text-accent" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              THE BLACK BOX — AI Battery Intelligence
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Predictive Safety Engine · <span className="font-bold text-foreground">SENSE → ANALYZE → PREDICT</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-surface p-1 shadow-sm text-xs font-extrabold">
            <button
              onClick={() => { setUseBenchmarkMode(false) }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                !useBenchmarkMode ? 'bg-warning text-slate-900 shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" /> Live
            </button>
            <button
              onClick={() => setUseBenchmarkMode(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                useBenchmarkMode ? 'bg-critical text-white shadow-sm' : 'text-muted hover:text-foreground'
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Benchmark
            </button>
          </div>
          <Button onClick={() => setReportModalOpen(true)} variant="outline" className="gap-1.5 font-bold text-xs">
            <FileText className="h-3.5 w-3.5" /> PDF
          </Button>
          <Select value={window} onChange={(e) => setWindow(e.target.value as TimeWindow)} aria-label="Time window">
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-2xl border border-healthy/40 bg-healthy/10 p-3.5 shadow-sm text-center">
          <span className="block text-[10px] font-bold uppercase text-healthy">Cell 01 V</span>
          <span className="mt-1 block text-lg font-black text-foreground tabular-nums">{cell1V.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-healthy/40 bg-healthy/10 p-3.5 shadow-sm text-center">
          <span className="block text-[10px] font-bold uppercase text-healthy">Cell 02 V</span>
          <span className="mt-1 block text-lg font-black text-foreground tabular-nums">{cell2V.toFixed(2)} V</span>
        </div>
        <div className={`rounded-2xl border p-3.5 shadow-sm text-center ${cell3V < 2.5 ? 'border-critical/60 bg-critical/15 text-critical animate-pulse' : 'border-healthy/40 bg-healthy/10'}`}>
          <span className="block text-[10px] font-bold uppercase">Cell 03 V</span>
          <span className="mt-1 block text-lg font-black tabular-nums">{cell3V.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm text-center">
          <span className="block text-[10px] font-bold uppercase text-faint">ΔV Imbalance</span>
          <span className="mt-1 block text-lg font-black text-critical tabular-nums">{imbalanceV.toFixed(2)} V</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm text-center">
          <span className="block text-[10px] font-bold uppercase text-faint">SOH Health</span>
          <span className="mt-1 block text-lg font-black text-accent tabular-nums">{pack.soh.toFixed(0)}%</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm text-center col-span-2 sm:col-span-1">
          <span className="block text-[10px] font-bold uppercase text-faint">Pack Temp</span>
          <span className="mt-1 block text-lg font-black text-warning tabular-nums">{pack.temperature.toFixed(1)}°C</span>
        </div>
      </div>

      {/* Accordion Controls */}
      <div className="flex items-center justify-between border-b border-line pb-3 mt-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" /> 9 Analytics Modules
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll} className="gap-1 text-xs font-bold text-accent">
            <Maximize2 className="h-3.5 w-3.5" /> Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="gap-1 text-xs font-bold text-muted">
            <Minimize2 className="h-3.5 w-3.5" /> Collapse
          </Button>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {analyticsModules.map((item) => {
          const isOpen = !!expandedItems[item.id]
          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen ? 'border-accent/40 bg-surface shadow-md' : 'border-line bg-surface/60 hover:border-accent/30'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className="flex w-full items-center justify-between p-4 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-background font-black text-xs shadow-sm">
                    #{item.id}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <span className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-slate-100/50 text-muted transition-colors hover:text-foreground">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-line/60 p-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {item.component}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
