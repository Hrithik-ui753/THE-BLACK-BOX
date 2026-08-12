declare module 'plotly.js-dist-min' {
  export interface PlotlyData {
    type?: string
    mode?: string
    x?: (number | string)[]
    y?: number[]
    z?: number[] | number[][]
    name?: string
    marker?: Record<string, unknown>
    line?: Record<string, unknown>
    hovertemplate?: string
    [key: string]: unknown
  }
  export interface PlotlyLayout {
    [key: string]: unknown
  }
  const plotly: {
    newPlot: (el: HTMLElement, data: PlotlyData[], layout: PlotlyLayout, config?: Record<string, unknown>) => void
    react: (el: HTMLElement, data: PlotlyData[], layout: PlotlyLayout, config?: Record<string, unknown>) => void
    purge: (el: HTMLElement) => void
  }
  export default plotly
}
