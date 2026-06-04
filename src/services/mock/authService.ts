import type {
    IAuthService,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    LogoutRequest,
    SessionCheckResponse,
} from '../types'

// Simulated network delay: 300-800ms
const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

export const mockAuthService: IAuthService = {
    async sendOtp(_request: SendOtpRequest): Promise<SendOtpResponse> {
        await delay()
        return {
            success: true,
            retryAfterSeconds: 30,
            expiresInSeconds: 300,
        }
    },

    async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        await delay()

        // Accept any 6-digit OTP for mock mode
        if (!request.otp || request.otp.length < 4) {
            throw new Error('Invalid OTP')
        }

        const now = Date.now()
        return {
            success: true,
            tokens: {
                access: {
                    token: `mock_access_${now}`,
                    expiresAt: now + 3600_000, // 1 hour
                },
                refresh: {
                    token: `mock_refresh_${now}`,
                    expiresAt: now + 30 * 24 * 3600_000, // 30 days
                },
            },
            isNewUser: false,
        }
    },

    async logout(_request?: LogoutRequest): Promise<void> {
        await delay()
    },

    async checkSession(): Promise<SessionCheckResponse> {
        await delay()
        const token = localStorage.getItem('ht_auth_token')
        if (!token) {
            return { valid: false }
        }
        return { valid: true, phone: '+91 98765 43210' }
    },
}