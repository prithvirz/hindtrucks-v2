import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../state/AppProviders'
import type { ReactElement } from 'react'

interface ProvidersConfig {
    route?: string
}

export function renderWithProviders(
    ui: ReactElement,
    config: ProvidersConfig = {},
) {
    const { route = '/' } = config

    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <MemoryRouter initialEntries={[route]}>
                <AppProviders>
                    {children}
                </AppProviders>
            </MemoryRouter>
        )
    }

    return {
        user: userEvent.setup(),
        ...render(ui, { wrapper: Wrapper }),
    }
}

export * from '@testing-library/react'
export { userEvent }