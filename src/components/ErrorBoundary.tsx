import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ApiError, AuthError, NetworkError, ValidationError } from '../services/errors'
import { captureException } from '../lib/sentry'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        captureException(error, { componentStack: errorInfo.componentStack })
        console.error('[ErrorBoundary] Caught error:', error.message)
        console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            const { error } = this.state

            // Determine user-friendly message based on error type
            let title = 'Something went wrong'
            let message = 'An unexpected error occurred. Please try again.'
            let icon = '⚠️'

            if (error instanceof NetworkError) {
                title = 'Connection Error'
                message = 'Unable to reach the server. Please check your internet connection and try again.'
                icon = '📡'
            } else if (error instanceof AuthError) {
                title = 'Session Expired'
                message = 'Your session has expired. Please log in again.'
                icon = '🔒'
            } else if (error instanceof ValidationError) {
                title = 'Invalid Data'
                message = error.message || 'The data submitted is invalid.'
                icon = '📝'
            } else if (error instanceof ApiError) {
                title = `Error (${error.status})`
                message = error.message
                icon = '❌'
            }

            return (
                <div className="h-full w-full flex items-center justify-center bg-surface px-6">
                    <div className="flex flex-col items-center text-center max-w-sm">
                        <div className="text-5xl mb-4">{icon}</div>
                        <h1 className="text-xl font-black text-ink mb-2">{title}</h1>
                        <p className="text-sm font-bold text-ink-muted mb-6">{message}</p>
                        <button
                            onClick={this.handleRetry}
                            className="px-6 py-3 bg-accent text-white font-black rounded-xl border border-[#E0590E] hover:bg-[#E0590E] active:translate-y-[1px] transition-all shadow-sm"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}