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

    it('renders send OTP button', () => {
        renderWithProviders(<Login />)
        expect(screen.getByRole('button', { name: 'login.sendOtp' })).toBeInTheDocument()
    })

    it('allows typing a phone number', async () => {
        renderWithProviders(<Login />)
        const input = screen.getByPlaceholderText('98765 43210')
        await userEvent.type(input, '9876543210')
        expect(input).toHaveValue('9876543210')
    })

    it('disables send OTP button when phone is empty', () => {
        renderWithProviders(<Login />)
        const btn = screen.getByRole('button', { name: 'login.sendOtp' })
        expect(btn).toBeDisabled()
    })
})