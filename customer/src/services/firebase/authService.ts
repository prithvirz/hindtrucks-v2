import { signInAnonymously, signOut } from 'firebase/auth'
import { auth } from '@hindtrucks/shared/firebase'
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
        const credential = auth.currentUser ?? (await signInAnonymously(auth)).user
        localStorage.setItem('htc_firebase_uid', credential.uid)
        return { success: true, isNewUser }
    },

    async logout(): Promise<void> {
        localStorage.removeItem('htc_firebase_uid')
        if (auth.currentUser) {
            await signOut(auth)
        }
    },

    async checkSession(): Promise<SessionCheckResponse> {
        const uid = auth.currentUser?.uid ?? localStorage.getItem('htc_firebase_uid')
        const phone = localStorage.getItem('htc_phone') ?? undefined
        return { valid: Boolean(uid && phone), phone }
    },
}
