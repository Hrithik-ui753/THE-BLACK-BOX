import { Suspense, lazy, Component, type ErrorInfo, type ReactNode } from 'react'
import type { Battery, PackTelemetry } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { BatteryPack2D } from './BatteryPack2D'
import { LoadingState } from '@/components/states/States'

const BatteryPack3D = lazy(() => import('./BatteryPack3D'))

class ThreeDErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[BatteryVisualization 3D WebGL Fallback to 2D]:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * The hero battery visualization. Uses the 3D scene by default;
 * falls back to the lightweight 2D view for reduced-motion users
 * or when the user toggles "2D View" (great for low-power devices).
 * The 3D chunk is lazy-loaded so the rest of the app stays lean.
 */
export function BatteryVisualization({
  battery,
  pack,
  selectedCell,
  onSelectCell,
  className,
}: {
  battery: Battery
  pack: PackTelemetry | undefined
  selectedCell: number | null
  onSelectCell: (index: number) => void
  className?: string
}) {
  const mode = useAppStore((s) => s.batteryViewMode)
  const reduced = useReducedMotion()
  const effectiveMode = reduced ? '2d' : mode

  const fallback2D = (
    <BatteryPack2D
      battery={battery}
      pack={pack}
      selectedCell={selectedCell}
      onSelectCell={onSelectCell}
      className={className}
    />
  )

  if (effectiveMode === '3d') {
    return (
      <ThreeDErrorBoundary fallback={fallback2D}>
        <Suspense fallback={<LoadingState message="Loading 3D battery view…" />}>
          <BatteryPack3D battery={battery} />
        </Suspense>
      </ThreeDErrorBoundary>
    )
  }
  return fallback2D
}
