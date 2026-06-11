import {
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { mapFirebaseError } from '../firebaseErrors'
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
    try {
      const e164 = '+91' + phone.replace(/\D/g, '')
      // Always recreate verifier to avoid stale state after previous CAPTCHA challenges
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        recaptchaVerifier = null
      }
      let container = document.getElementById('ht-recaptcha')
      if (!container) {
        container = document.createElement('div')
        container.id = 'ht-recaptcha'
        document.body.appendChild(container)
      }
      recaptchaVerifier = new RecaptchaVerifier(auth, 'ht-recaptcha', { size: 'invisible' })
      confirmationResult = await signInWithPhoneNumber(auth, e164, recaptchaVerifier)
      return { success: true, retryAfterSeconds: 60, expiresInSeconds: 300 }
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async verifyOtp({ otp }: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
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
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async logout(_request?: LogoutRequest): Promise<void> {
    try {
      if (confirmationResult) {
        confirmationResult = null
      }
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        recaptchaVerifier = null
      }
      await signOut(auth)
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },

  async checkSession(): Promise<SessionCheckResponse> {
    try {
      return new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub()
          if (user) {
            const phone = user.phoneNumber?.replace('+91', '') || localStorage.getItem('ht_phone') || ''
            resolve({ valid: true, phone })
          } else {
            resolve({ valid: false })
          }
        })
      })
    } catch (err: unknown) {
      throw mapFirebaseError(err)
    }
  },
}
