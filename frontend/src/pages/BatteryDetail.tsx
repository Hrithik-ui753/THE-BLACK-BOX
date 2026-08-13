import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Box, Boxes, Bot, ChevronRight, Trash2, Wifi } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useBattery, usePack } from '@/hooks/usePack'
import { BatteryVisualization } from '@/components/battery/BatteryVisualization'
import { BatteryMetrics } from '@/components/battery/BatteryMetrics'
import { CellDetailPanel } from '@/components/battery/CellDetailPanel'
import { BatteryQuickSwitcher } from '@/components/battery/BatteryQuickSwitcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState, EmptyState } from '@/components/states/States'
import { aiService } from '@/services/ai/aiService'
import { STATUS_LABEL } from '@/constants/status'
import { cn } from '@/utils/cn'

export function BatteryDetail() {
  const { batteryId } = useParams<{ batteryId: string }>()
  const navigate = useNavigate()
  const battery = useBattery(batteryId)
  const pack = usePack(batteryId)
  const selectedCell = useAppStore((s) => s.selectedCellIndex)
  const selectCell = useAppStore((s) => s.selectCell)
  const selectBattery = useAppStore((s) => s.selectBattery)
  const removeBattery = useAppStore((s) => s.removeBattery)
  const updateBatteryStatus = useAppStore((s) => s.updateBatteryStatus)
  const viewMode = useAppStore((s) => s.batteryViewMode)
  const setViewMode = useAppStore((s) => s.setBatteryViewMode)
  const setChatOpen = useAppStore((s) => s.setChatOpen)

  useEffect(() => {
    selectBattery(batteryId ?? null)
    return () => selectBattery(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batteryId])

  const packInsight = useMemo(() => {
    if (!battery || !pack) return null
    return aiService.getBatteryInsight(battery, pack)
  }, [battery, pack])

  if (!battery) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="Battery not found" message="This battery doesn't exist or was removed." />
      </div>
    )
  }

  const handleRemove = () => {
    if (batteryId) {
      removeBattery(batteryId)
      navigate('/dashboard')
    }
  }

  const toggleConnection = () => {
    if (batteryId && battery) {
      updateBatteryStatus(batteryId, battery.status === 'offline' ? 'healthy' : 'offline')
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 lg:px-8">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{battery.name}</h1>
          <Badge variant={battery.status === 'critical' ? 'critical' : battery.status === 'warning' ? 'warning' : battery.status === 'offline' ? 'offline' : 'healthy'}>
            <span className="h-1.5 w-1.5 rounded-full bg-current status-dot-pulse" />
            {battery.status === 'offline' ? 'Offline' : STATUS_LABEL[battery.status]}
          </Badge>
          <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted">
            {battery.type}
          </span>
          {battery.deviceId && (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              {battery.deviceId}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Live Connection Toggle for Demo */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleConnection}
            className={cn(
              'gap-1.5 font-bold transition-all',
              battery.status === 'offline'
                ? 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20'
                : 'border-healthy/40 bg-healthy/10 text-healthy hover:bg-healthy/20',
            )}
          >
            <Wifi className="h-3.5 w-3.5" />
            {battery.status === 'offline' ? 'Connect Device' : 'Simulate Offline'}
          </Button>

          {/* 3D / 2D View Switcher */}
          <div className="flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Battery view mode">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              aria-pressed={viewMode === '3d'}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                viewMode === '3d' ? 'bg-surface-3 text-foreground font-extrabold' : 'text-muted hover:text-foreground',
              )}
            >
              <Boxes className="h-3.5 w-3.5 text-accent" /> 3D View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              aria-pressed={viewMode === '2d'}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                viewMode === '2d' ? 'bg-surface-3 text-foreground font-extrabold' : 'text-muted hover:text-foreground',
              )}
            >
              <Box className="h-3.5 w-3.5 text-accent" /> 2D View
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={() => setChatOpen(true)}>
            <Bot className="h-3.5 w-3.5 text-accent" /> Ask AI
          </Button>
          <Button size="sm" variant="outline" className="border-critical/30 text-critical hover:bg-critical/10" onClick={handleRemove}>
            <Trash2 className="h-3.5 w-3.5" /> Remove Pack
          </Button>
        </div>
      </div>

      {/* Quick 1 / 2 / 3 Battery Switcher Bar */}
      <div className="mt-3">
        <BatteryQuickSwitcher currentBatteryId={battery.id} />
      </div>

      {/* metrics */}
      {pack && (
        <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3.5">
          <BatteryMetrics pack={pack} />
        </div>
      )}

      {/* visualization — the hero */}
      <div className="relative mt-5 min-h-[440px] flex-1 overflow-hidden rounded-2xl border border-line bg-background-2 shadow-sm">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="absolute left-4 top-3 z-10 flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
          <span className={cn('h-2 w-2 rounded-full', battery.status === 'offline' ? 'bg-faint' : 'bg-healthy status-dot-pulse')} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">
            {battery.status === 'offline' ? 'Offline · Disconnected' : `Live ${viewMode.toUpperCase()} Pack Visualization`}
          </span>
        </div>

        {!pack ? (
          <LoadingState message="Loading latest battery telemetry..." />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute inset-0">
            <BatteryVisualization
              battery={battery}
              pack={pack}
              selectedCell={selectedCell}
              onSelectCell={selectCell}
            />
          </motion.div>
        )}
      </div>

      {/* Instruction text with distance from visualization box */}
      <p className="mt-4 mb-2 text-center text-xs font-medium text-muted">
        Click a cell to inspect details · Drag to rotate 3D view · Scroll to zoom
      </p>

      {/* pack AI insight strip box below visualization with clear separation */}
      {packInsight && (
        <motion.button
          type="button"
          onClick={() => setChatOpen(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-3 mb-8 flex w-full items-center gap-3.5 rounded-xl border border-accent/30 bg-surface/95 px-5 py-3.5 text-left shadow-md transition-all hover:border-accent/60 hover:bg-surface-2/80"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10">
            <Bot className="h-4 w-4 text-accent" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-accent-soft">AI Pack Health Insight</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-foreground">{packInsight.headline}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-accent" />
        </motion.button>
      )}

      {pack && (
        <CellDetailPanel battery={battery} pack={pack} cellIndex={selectedCell} onClose={() => selectCell(null)} />
      )}
    </div>
  )
}
