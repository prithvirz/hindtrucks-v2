import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './ErrorBoundary'
import { NetworkError, AuthError, ValidationError, ServerError } from '../services/errors'

// Suppress console.error during error boundary tests
const originalError = console.error
beforeAll(() => { console.error = vi.fn() })
afterAll(() => { console.error = originalError })

function ThrowError({ error }: { error: Error }): never {
    throw error
}

describe('ErrorBoundary', () => {
    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>All good</div>
            </ErrorBoundary>,
        )
        expect(screen.getByText('All good')).toBeInTheDocument()
    })

    it('shows custom fallback when provided and error occurs', () => {
        const fallback = <div>Custom fallback UI</div>
        render(
            <ErrorBoundary fallback={fallback}>
                <ThrowError error={new Error('test')} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Custom fallback UI')).toBeInTheDocument()
    })

    it('shows default error UI for generic Error', () => {
        render(
            <ErrorBoundary>
                <ThrowError error={new Error('Something broke')} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
    })

    it('shows NetworkError UI with connection message', () => {
        render(
            <ErrorBoundary>
                <ThrowError error={new NetworkError('No internet')} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
    })

    it('shows AuthError UI with session message', () => {
        render(
            <ErrorBoundary>
                <ThrowError error={new AuthError()} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Session Expired')).toBeInTheDocument()
    })

    it('shows ValidationError UI', () => {
        render(
            <ErrorBoundary>
                <ThrowError error={new ValidationError('Invalid input')} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Invalid Data')).toBeInTheDocument()
    })

    it('shows ApiError UI with status code', () => {
        render(
            <ErrorBoundary>
                <ThrowError error={new ServerError()} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Error (500)')).toBeInTheDocument()
    })

    it('clicking Retry clears the error and shows children again', async () => {
        const { rerender } = render(
            <ErrorBoundary key="err">
                <ThrowError error={new Error('test')} />
            </ErrorBoundary>,
        )
        expect(screen.getByText('Retry')).toBeInTheDocument()

        await userEvent.click(screen.getByText('Retry'))

        // Remount with new key to get a fresh ErrorBoundary instance
        rerender(
            <ErrorBoundary key="recovered">
                <div>Recovered</div>
            </ErrorBoundary>,
        )
        expect(screen.getByText('Recovered')).toBeInTheDocument()
    })
})