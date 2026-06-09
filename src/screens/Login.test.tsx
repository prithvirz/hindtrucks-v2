import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../__tests__/test-utils'
import Login from './Login'

describe('Login Screen', () => {
    it('renders the login title', () => {
        renderWithProviders(<Login />)
        expect(screen.getByText('login.title')).toBeInTheDocument()
    })

    it('renders phone number input', () => {
        renderWithProviders(<Login />)
        expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument()
    })

    it('renders continue button', () => {
        renderWithProviders(<Login />)
        expect(screen.getByRole('button', { name: 'login.continue' })).toBeInTheDocument()
    })

    it('allows typing a phone number', async () => {
        renderWithProviders(<Login />)
        const input = screen.getByPlaceholderText('98765 43210')
        await userEvent.type(input, '9876543210')
        expect(input).toHaveValue('9876543210')
    })

    it('disables continue button until phone is valid', async () => {
        renderWithProviders(<Login />)
        const btn = screen.getByRole('button', { name: 'login.continue' })
        expect(btn).toBeDisabled()

        await userEvent.type(screen.getByPlaceholderText('98765 43210'), '9876543210')
        expect(btn).not.toBeDisabled()
    })
})
