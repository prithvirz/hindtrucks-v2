import { signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth'
import { auth, newRecaptchaVerifier } from '@hindtrucks/shared/firebase'
import type { IAuthService, SendOtpRequest, SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse, SessionCheckResponse } from '../types'

// The ConfirmationResult from signInWithPhoneNumber must persist between the
// stateless sendOtp/verifyOtp calls — hold it module-level while in flight.
let pendingConfirmation: ConfirmationResult | null = null

export const firebaseAuthService: IAuthService = {
    async sendOtp(req: SendOtpRequest): Promise<SendOtpResponse> {
        const verifier = newRecaptchaVerifier()
        try {
            pendingConfirmation = await signInWithPhoneNumber(auth, req.phone, verifier)
        } catch (err) {
            verifier.clear()
            throw err instanceof Error ? err : new Error('Failed to send OTP')
        }
        return { success: true, retryAfterSeconds: 30 }
    },

    async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        if (!pendingConfirmation) {
            throw new Error('No OTP request in progress. Please request a new code.')
        }
        if (!/^\d{6}$/.test(req.otp)) throw new Error('Invalid OTP')

        const isNewUser = localStorage.getItem(`htc_registered_${req.phone}`) !== 'true'
        const credential = await pendingConfirmation.confirm(req.otp)
        pendingConfirmation = null
        localStorage.setItem('htc_firebase_uid', credential.user.uid)
        return { success: true, isNewUser }
    },

    async logout(): Promise<void> {
        pendingConfirmation = null
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
