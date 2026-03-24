import { Component } from 'react'

/**
 * Catches rendering errors anywhere in the child tree.
 * Must be a class component — hooks cannot implement getDerivedStateFromError.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught rendering error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const message = this.state.error?.message ?? 'An unexpected error occurred.'

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md w-full p-8 text-center space-y-5">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-8 h-8 text-red-500"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </div>

          {/* Error detail — dev only */}
          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="text-left text-xs text-gray-400 bg-gray-50 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap break-all">
              {this.state.error.stack}
            </pre>
          )}

          {/* Action */}
          <button
            onClick={() => this.handleReset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-sidebar text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }
}
