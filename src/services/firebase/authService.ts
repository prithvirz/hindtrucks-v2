import { signInAnonymously, signOut } from 'firebase/auth'
import { auth } from '@hindtrucks/shared/firebase'
import type {
    IAuthService,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    LogoutRequest,
    SessionCheckResponse,
} from '../types'

const delay = () => new Promise<void>((r) => setTimeout(r, 250))

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

export const firebaseAuthService: IAuthService = {
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
        if (!request.otp || request.otp.length < 4) {
            throw new Error('Invalid OTP')
        }

        const credential = auth.currentUser ?? (await signInAnonymously(auth)).user
        localStorage.setItem('ht_firebase_uid', credential.uid)

        return {
            success: true,
            tokens: authToken(credential.uid),
            isNewUser: false,
        }
    },

    async logout(_request?: LogoutRequest): Promise<void> {
        localStorage.removeItem('ht_firebase_uid')
        if (auth.currentUser) {
            await signOut(auth)
        }
    },

    async checkSession(): Promise<SessionCheckResponse> {
        const uid = auth.currentUser?.uid ?? localStorage.getItem('ht_firebase_uid')
        const phone = localStorage.getItem('ht_phone') ?? undefined
        return { valid: Boolean(uid), phone }
    },
}
