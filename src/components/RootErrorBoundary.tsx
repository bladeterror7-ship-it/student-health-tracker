import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Render-д гарсан алдааг барьж «цагаан дэлгэц» оронд мэдээлэл харуулна.
 */
export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App error]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-svh bg-slate-950 px-6 py-10 text-emerald-50">
          <h1 className="text-xl font-semibold text-orange-300">
            Ап ачаалахад алдаа гарлаа
          </h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-100/80">
            Safari-д: меню бар дээрх Develop → Show JavaScript Console —
            алдааны мөрүүдийг үзээрэй. Дараахыг скриншотлоно уу.
          </p>
          <pre className="mt-6 overflow-auto rounded-xl border border-orange-400/35 bg-black/40 p-4 text-xs whitespace-pre-wrap text-orange-50/95">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            type="button"
            className="mt-6 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-emerald-950"
            onClick={() => window.location.reload()}
          >
            Дахин ачаалах
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
