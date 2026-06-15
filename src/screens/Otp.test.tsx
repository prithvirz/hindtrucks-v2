import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import Otp from './Otp'
import { AuthProvider } from '../state/AuthContext'

const { verifyOtpMock, sendOtpMock } = vi.hoisted(() => ({
    verifyOtpMock: vi.fn(),
    sendOtpMock: vi.fn(),
}))

vi.mock('../services/index', () => ({
    authService: {
        verifyOtp: verifyOtpMock,
        sendOtp: sendOtpMock,
        logout: vi.fn().mockResolvedValue(undefined),
        checkSession: vi.fn().mockResolvedValue({ valid: false }),
    },
}))

function renderOtp(phone?: string) {
    return render(
        <AuthProvider>
            <MemoryRouter initialEntries={[{ pathname: '/otp', state: phone ? { phone } : undefined }]}>
                <Routes>
                    <Route path="/otp" element={<Otp />} />
                    <Route path="/login" element={<div>LOGIN_PAGE</div>} />
                    <Route path="/home" element={<div>HOME_PAGE</div>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    )
}

describe('Otp Screen', () => {
    beforeEach(() => {
        localStorage.clear()
        verifyOtpMock.mockReset()
        sendOtpMock.mockReset()
        verifyOtpMock.mockResolvedValue({
            success: true,
            tokens: {
                access: { token: 'tok', expiresAt: 9999999999999 },
                refresh: { token: 'ref', expiresAt: 9999999999999 },
            },
            isNewUser: false,
        })
        sendOtpMock.mockResolvedValue({ success: true, retryAfterSeconds: 30, expiresInSeconds: 300 })
    })

    it('redirects to /login when no phone is in route state', async () => {
        renderOtp(undefined)
        await waitFor(() => expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument())
    })

    it('renders the 6-digit input and a disabled verify button initially', () => {
        renderOtp('9876543210')
        expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'otp.verify' })).toBeDisabled()
    })

    it('strips non-digits and caps the code at 6 digits', async () => {
        renderOtp('9876543210')
        const input = screen.getByPlaceholderText('••••••')
        await userEvent.type(input, 'ab12cd345678')
        expect(input).toHaveValue('123456')
    })

    it('verifies a complete code and navigates home', async () => {
        renderOtp('9876543210')
        const input = screen.getByPlaceholderText('••••••')
        await userEvent.type(input, '123456')

        const verifyBtn = screen.getByRole('button', { name: 'otp.verify' })
        expect(verifyBtn).toBeEnabled()
        await userEvent.click(verifyBtn)

        await waitFor(() => expect(verifyOtpMock).toHaveBeenCalledWith({ phone: '9876543210', otp: '123456' }))
        await waitFor(() => expect(screen.getByText('HOME_PAGE')).toBeInTheDocument())
    })

    it('starts the resend button disabled during the countdown', () => {
        renderOtp('9876543210')
        expect(screen.getByRole('button', { name: 'otp.resendIn' })).toBeDisabled()
    })
})
