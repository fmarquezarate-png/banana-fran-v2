import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <span className="text-6xl block mb-4">🍌</span>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Algo se ha torcido
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Ha habido un problema cargando esta pantalla. Prueba a recargar la app.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-egeo text-white font-semibold px-5 py-2.5 rounded-xl
                       hover:bg-egeo/90 active:scale-[0.98] transition-all"
          >
            ↻ Recargar
          </button>
          <details className="mt-6 text-left text-xs text-gray-400">
            <summary className="cursor-pointer">Detalles técnicos</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
