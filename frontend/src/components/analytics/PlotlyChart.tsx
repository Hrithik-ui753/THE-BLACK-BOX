import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface PlotlyModule {
  newPlot: (el: HTMLElement, data: PlotlyDatum[], layout: PlotlyLayout, config?: Record<string, unknown>) => void
  react: (el: HTMLElement, data: PlotlyDatum[], layout: PlotlyLayout, config?: Record<string, unknown>) => void
  purge: (el: HTMLElement) => void
}

interface PlotlyDatum {
  type?: string
  mode?: string
  x?: (number | string)[]
  y?: number[]
  z?: number[] | number[][]
  name?: string
  marker?: Record<string, unknown>
  line?: Record<string, unknown>
  hovertemplate?: string
}

interface PlotlyLayout {
  title?: { text: string; font?: Record<string, unknown> }
  paper_bgcolor?: string
  plot_bgcolor?: string
  font?: Record<string, unknown>
  margin?: Record<string, number>
  showlegend?: boolean
  scene?: Record<string, unknown>
  xaxis?: Record<string, unknown>
  yaxis?: Record<string, unknown>
  colorway?: string[]
}

/**
 * Plotly is heavy (~4MB) — it is only downloaded when an advanced analytical
 * view is actually opened, never on app load.
 */
export function PlotlyChart({
  data,
  layout,
  height = 380,
}: {
  data: PlotlyDatum[]
  layout: PlotlyLayout
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [plotly, setPlotly] = useState<PlotlyModule | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    import('plotly.js-dist-min')
      .then((m) => {
        if (mounted) setPlotly((m.default ?? m) as PlotlyModule)
      })
      .catch(() => mounted && setError(true))
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!plotly || !ref.current) return
    plotly.react(ref.current, data, layout, { displayModeBar: false, responsive: true })
  }, [plotly, data, layout])

  useEffect(() => {
    return () => {
      if (plotly && ref.current) plotly.purge(ref.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotly])

  if (error) {
    return <p className="py-8 text-center text-xs text-muted">Advanced view unavailable.</p>
  }
  if (!plotly) {
    return <Skeleton className="w-full" style={{ height }} />
  }
  return <div ref={ref} style={{ height, width: '100%' }} />
}
