import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-critical/30 bg-critical/10 text-critical shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-foreground">Something went wrong</h2>
          <p className="mt-1 max-w-md text-xs text-muted">
            {this.state.error?.message || 'An unexpected rendering error occurred while loading this view.'}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button size="sm" onClick={this.handleReset} className="gap-2 font-medium">
              <RefreshCw className="h-3.5 w-3.5" /> Reload View
            </Button>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/')} className="gap-2 font-medium">
              <LayoutDashboard className="h-3.5 w-3.5" /> Return to Home
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
