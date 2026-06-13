import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

function renderLogin() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    )
}

describe('Login Screen', () => {
    it('renders the login title', () => {
        renderLogin()
        expect(screen.getByText('login.title')).toBeInTheDocument()
    })

    it('renders phone number input', () => {
        renderLogin()
        expect(screen.getByPlaceholderText('98765 43210')).toBeInTheDocument()
    })

    it('renders send OTP button', () => {
        renderLogin()
        expect(screen.getByRole('button', { name: 'login.sendOtp' })).toBeInTheDocument()
    })

    it('allows typing a phone number', async () => {
        renderLogin()
        const input = screen.getByPlaceholderText('98765 43210')
        await userEvent.type(input, '9876543210')
        expect(input).toHaveValue('9876543210')
    })

    it('disables send OTP button when phone is empty', () => {
        renderLogin()
        const btn = screen.getByRole('button', { name: 'login.sendOtp' })
        expect(btn).toBeDisabled()
    })
})
