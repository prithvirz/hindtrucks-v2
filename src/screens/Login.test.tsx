import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import Login from './Login'

const { sendOtpMock } = vi.hoisted(() => ({ sendOtpMock: vi.fn() }))

vi.mock('../services/index', () => ({
    authService: {
        sendOtp: sendOtpMock,
        verifyOtp: vi.fn(),
        logout: vi.fn().mockResolvedValue(undefined),
        checkSession: vi.fn().mockResolvedValue({ valid: false }),
    },
}))

function renderLogin() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    )
}

function renderLoginWithRoutes() {
    return render(
        <MemoryRouter initialEntries={['/login']}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/otp" element={<div>OTP_PAGE</div>} />
            </Routes>
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

    it('enables send OTP only after a full 10-digit number', async () => {
        renderLogin()
        const input = screen.getByPlaceholderText('98765 43210')
        await userEvent.type(input, '98765')
        expect(screen.getByRole('button', { name: 'login.sendOtp' })).toBeDisabled()
        await userEvent.type(input, '43210')
        expect(screen.getByRole('button', { name: 'login.sendOtp' })).toBeEnabled()
    })

    it('sends OTP with an E.164 (+91) number and navigates to /otp', async () => {
        sendOtpMock.mockReset()
        sendOtpMock.mockResolvedValue({ success: true, retryAfterSeconds: 30, expiresInSeconds: 300 })

        renderLoginWithRoutes()
        await userEvent.type(screen.getByPlaceholderText('98765 43210'), '9876543210')
        await userEvent.click(screen.getByRole('button', { name: 'login.sendOtp' }))

        await waitFor(() => expect(sendOtpMock).toHaveBeenCalledWith({ phone: '+919876543210' }))
        await waitFor(() => expect(screen.getByText('OTP_PAGE')).toBeInTheDocument())
    })
})
