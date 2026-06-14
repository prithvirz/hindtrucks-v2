import type { IAuthService, SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse, SessionCheckResponse } from '../types'

const delay = () => new Promise<void>((r) => setTimeout(r, 300))

export const firebaseAuthService: IAuthService = {
    async sendOtp(_req: SendOtpRequest): Promise<SendOtpResponse> {
        await delay()
        return { success: true, retryAfterSeconds: 30 }
    },

    async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        await delay()
        if (!/^\d{6}$/.test(req.otp)) throw new Error('Invalid OTP')
        const isNewUser = localStorage.getItem(`htc_registered_${req.phone}`) !== 'true'
        return { success: true, isNewUser }
    },

    async logout(): Promise<void> {
        await delay()
    },

    async checkSession(): Promise<SessionCheckResponse> {
        const phone = localStorage.getItem('htc_phone') ?? undefined
        return { valid: Boolean(phone), phone }
    },
}