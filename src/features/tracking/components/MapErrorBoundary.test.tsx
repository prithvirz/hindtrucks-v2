import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapErrorBoundary } from './MapErrorBoundary';

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test map error');
    }
    return <div>Map content rendered successfully</div>;
}

describe('MapErrorBoundary', () => {
    // Suppress console.error from React error boundary logging
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = vi.fn((...args: unknown[]) => {
            if (typeof args[0] === 'string' && args[0].includes('Test map error')) return;
            if (typeof args[0] === 'string' && args[0].includes('The above error occurred')) return;
            originalConsoleError(...args);
        });
    });
    afterAll(() => {
        console.error = originalConsoleError;
    });

    it('renders children when no error', () => {
        render(
            <MapErrorBoundary>
                <ThrowError shouldThrow={false} />
            </MapErrorBoundary>,
        );

        expect(screen.getByText(/Map content rendered successfully/i)).toBeInTheDocument();
    });

    it('renders fallback UI when child throws error', () => {
        render(
            <MapErrorBoundary>
                <ThrowError shouldThrow={true} />
            </MapErrorBoundary>,
        );

        expect(screen.getByText(/Map failed to load/i)).toBeInTheDocument();
        expect(screen.getByText(/The map tiles could not be loaded/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('uses default fallback height of 250px', () => {
        render(
            <MapErrorBoundary>
                <ThrowError shouldThrow={true} />
            </MapErrorBoundary>,
        );

        const fallbackDiv = screen.getByText(/Map failed to load/i).closest('div');
        expect(fallbackDiv?.style.height).toBe('250px');
    });

    it('uses custom fallbackHeight when provided', () => {
        render(
            <MapErrorBoundary fallbackHeight="100%">
                <ThrowError shouldThrow={true} />
            </MapErrorBoundary>,
        );

        const fallbackDiv = screen.getByText(/Map failed to load/i).closest('div');
        expect(fallbackDiv?.style.height).toBe('100%');
    });

    it('retries and renders children after clicking Retry button', async () => {
        let shouldThrow = true;

        // We need a dynamic component that can toggle error state
        function DynamicThrow() {
            if (shouldThrow) throw new Error('Test map error');
            return <div>Map content rendered successfully</div>;
        }

        render(
            <MapErrorBoundary>
                <DynamicThrow />
            </MapErrorBoundary>,
        );

        // Error boundary shows fallback
        expect(screen.getByText(/Map failed to load/i)).toBeInTheDocument();

        // Fix the error source
        shouldThrow = false;

        // Click Retry to reset error boundary state
        const retryBtn = screen.getByRole('button', { name: /Retry/i });
        await userEvent.click(retryBtn);

        // After retry, children should render (since shouldThrow is now false)
        // Note: The error boundary resets state, but the child component
        // re-renders with the same props. Since shouldThrow is now false,
        // it should render successfully.
        expect(screen.getByText(/Map content rendered successfully/i)).toBeInTheDocument();
    });
});