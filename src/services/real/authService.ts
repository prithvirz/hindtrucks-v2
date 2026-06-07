import {
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import type {
  IAuthService,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LogoutRequest,
  SessionCheckResponse,
} from '../types'

let confirmationResult: ConfirmationResult | null = null
let recaptchaVerifier: RecaptchaVerifier | null = null

export const authService: IAuthService = {
  async sendOtp({ phone }: SendOtpRequest): Promise<SendOtpResponse> {
    const e164 = '+91' + phone.replace(/\D/g, '')
    if (!recaptchaVerifier) {
      let container = document.getElementById('ht-recaptcha')
      if (!container) {
        container = document.createElement('div')
        container.id = 'ht-recaptcha'
        document.body.appendChild(container)
      }
      recaptchaVerifier = new RecaptchaVerifier(auth, 'ht-recaptcha', { size: 'invisible' })
    }
    confirmationResult = await signInWithPhoneNumber(auth, e164, recaptchaVerifier)
    return { success: true, retryAfterSeconds: 60, expiresInSeconds: 300 }
  },

  async verifyOtp({ otp }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    if (!confirmationResult) throw new Error('No pending OTP. Call sendOtp first.')
    const credential = await confirmationResult.confirm(otp)
    const token = await credential.user.getIdToken()
    const now = Date.now()
    return {
      success: true,
      tokens: {
        access: { token, expiresAt: now + 3600 * 1000 },
        refresh: { token, expiresAt: now + 30 * 24 * 3600 * 1000 },
      },
      isNewUser: false,
    }
  },

  async logout(_request?: LogoutRequest): Promise<void> {
    await signOut(auth)
  },

  async checkSession(): Promise<SessionCheckResponse> {
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub()
        if (user) {
          const phone = user.phoneNumber?.replace('+91', '') || ''
          resolve({ valid: true, phone })
        } else {
          resolve({ valid: false })
        }
      })
    })
  },
}
