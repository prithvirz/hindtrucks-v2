import { signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth'
import { auth, newRecaptchaVerifier } from '@hindtrucks/shared/firebase'
import type {
    IAuthService,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    LogoutRequest,
    SessionCheckResponse,
} from '../types'

function authToken(uid: string) {
    const now = Date.now()
    return {
        access: {
            token: `firebase_${uid}`,
            expiresAt: now + 3600_000,
        },
        refresh: {
            token: `firebase_refresh_${uid}`,
            expiresAt: now + 30 * 24 * 3600_000,
        },
    }
}

// The ConfirmationResult returned by signInWithPhoneNumber must survive between
// the sendOtp and verifyOtp calls (the IAuthService contract is stateless), so
// hold it module-level for the in-flight verification.
let pendingConfirmation: ConfirmationResult | null = null

export const firebaseAuthService: IAuthService = {
    async sendOtp(request: SendOtpRequest): Promise<SendOtpResponse> {
        const verifier = newRecaptchaVerifier()
        try {
            pendingConfirmation = await signInWithPhoneNumber(auth, request.phone, verifier)
        } catch (err) {
            // Free the widget so a retry can mount a fresh one.
            verifier.clear()
            throw err instanceof Error ? err : new Error('Failed to send OTP')
        }
        return {
            success: true,
            retryAfterSeconds: 30,
            expiresInSeconds: 300,
        }
    },

    async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        if (!pendingConfirmation) {
            throw new Error('No OTP request in progress. Please request a new code.')
        }
        if (!/^\d{6}$/.test(request.otp)) {
            throw new Error('Invalid OTP')
        }

        const credential = await pendingConfirmation.confirm(request.otp)
        pendingConfirmation = null
        const { uid } = credential.user
        localStorage.setItem('ht_firebase_uid', uid)

        return {
            success: true,
            tokens: authToken(uid),
            isNewUser: false,
        }
    },

    async logout(_request?: LogoutRequest): Promise<void> {
        pendingConfirmation = null
        localStorage.removeItem('ht_firebase_uid')
        if (auth.currentUser) {
            await signOut(auth)
        }
    },

    async checkSession(): Promise<SessionCheckResponse> {
        const uid = auth.currentUser?.uid ?? localStorage.getItem('ht_firebase_uid')
        const phone = localStorage.getItem('ht_phone') ?? undefined
        return { valid: Boolean(uid && phone), phone }
    },
}
