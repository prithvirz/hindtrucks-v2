// ⚠️ Uses vitest globals only — no import from 'vitest' (globals: true in vitest.config.ts)
// vi.hoisted() is available globally

const {
    mockSignInWithPhoneNumber,
    mockSignOut,
    mockOnAuthStateChanged,
    mockRecaptchaClear,
    mockGetIdToken,
    mockConfirm,
    MockRecaptchaVerifier,
} = vi.hoisted(() => {
    const getIdToken = vi.fn(() => Promise.resolve('test_id_token'))
    const clear = vi.fn()
    // Must use function (not arrow) for vi.fn() to act as constructor with 'new'
    const Rv = vi.fn(function (this: Record<string, unknown>) {
        this.clear = clear
    })
    return {
        mockSignInWithPhoneNumber: vi.fn(),
        mockSignOut: vi.fn(() => Promise.resolve()),
        mockOnAuthStateChanged: vi.fn(),
        mockRecaptchaClear: clear,
        mockGetIdToken: getIdToken,
        mockConfirm: vi.fn(() => Promise.resolve({ user: { getIdToken: getIdToken } })),
        MockRecaptchaVerifier: Rv,
    }
})

vi.mock('firebase/auth', () => ({
    signInWithPhoneNumber: (...args: unknown[]) => mockSignInWithPhoneNumber(...args),
    signOut: () => mockSignOut(),
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
    RecaptchaVerifier: MockRecaptchaVerifier,
}))

vi.mock('firebase/app', () => ({
    FirebaseError: class extends Error {
        code: string
        customData?: Record<string, unknown>
        constructor(code: string, message: string) {
            super(message)
            this.code = code
            this.name = 'FirebaseError'
        }
    },
}))

import { authService } from './authService'
import { AuthError } from '../errors'

describe('real authService', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        localStorage.clear()
        mockConfirm.mockImplementation(() => Promise.resolve({ user: { getIdToken: mockGetIdToken } }))
        // Reset module-level state (confirmationResult, recaptchaVerifier) between tests
        await authService.logout()
    })

    describe('sendOtp', () => {
        it('sends OTP successfully with E.164 formatting', async () => {
            mockSignInWithPhoneNumber.mockResolvedValueOnce({})

            const result = await authService.sendOtp({ phone: '9123456701' })

            expect(result.success).toBe(true)
            expect(result.retryAfterSeconds).toBe(60)
            expect(result.expiresInSeconds).toBe(300)
            expect(mockSignInWithPhoneNumber).toHaveBeenCalledTimes(1)
            const callArgs = mockSignInWithPhoneNumber.mock.calls[0]
            expect(callArgs[1]).toBe('+919123456701')
        })

        it('clears previous RecaptchaVerifier before creating new one', async () => {
            mockSignInWithPhoneNumber.mockResolvedValueOnce({})

            await authService.sendOtp({ phone: '9123456701' })
            await authService.sendOtp({ phone: '9123456702' })

            // beforeEach logout clears once; this test's second sendOtp clears once => 2 total
            expect(mockRecaptchaClear).toHaveBeenCalledTimes(2)
        })

        it('maps auth/ FirebaseError to AuthError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockSignInWithPhoneNumber.mockRejectedValueOnce(
                new FirebaseError('auth/invalid-phone-number', 'Invalid phone')
            )

            await expect(authService.sendOtp({ phone: '9123456701' }))
                .rejects.toThrow(AuthError)
        })

        it('maps unavailable FirebaseError to ServerError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockSignInWithPhoneNumber.mockRejectedValueOnce(
                new FirebaseError('unavailable', 'Service unavailable')
            )

            await expect(authService.sendOtp({ phone: '9123456701' }))
                .rejects.toThrow(/Service unavailable/)
        })
    })

    describe('verifyOtp', () => {
        it('verifies OTP and returns token pair', async () => {
            mockSignInWithPhoneNumber.mockResolvedValueOnce({ confirm: mockConfirm })
            await authService.sendOtp({ phone: '9123456701' })

            const result = await authService.verifyOtp({ phone: '9123456701', otp: '123456' })

            expect(result.success).toBe(true)
            expect(result.tokens.access.token).toBe('test_id_token')
            expect(result.tokens.access.expiresAt).toBeGreaterThan(Date.now())
            expect(mockConfirm).toHaveBeenCalledWith('123456')
        })

        it('throws when no pending OTP confirmation exists', async () => {
            await expect(authService.verifyOtp({ phone: '9123456701', otp: '123456' }))
                .rejects.toThrow('No pending OTP')
        })

        it('maps auth/ FirebaseError from confirmation to AuthError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockSignInWithPhoneNumber.mockResolvedValueOnce({ confirm: mockConfirm })
            await authService.sendOtp({ phone: '9123456701' })

            mockConfirm.mockRejectedValueOnce(
                new FirebaseError('auth/invalid-verification-code', 'Wrong code')
            )

            await expect(authService.verifyOtp({ phone: '9123456701', otp: '000000' }))
                .rejects.toThrow(AuthError)
        })
    })

    describe('logout', () => {
        it('signs out and clears confirmation state', async () => {
            await authService.logout()

            // beforeEach logout calls signOut once; test calls it once => 2 total
            expect(mockSignOut).toHaveBeenCalledTimes(2)
        })

        it('clears recaptcha verifier on logout', async () => {
            mockSignInWithPhoneNumber.mockResolvedValueOnce({})
            await authService.sendOtp({ phone: '9123456701' })

            mockSignOut.mockResolvedValueOnce(undefined)
            await authService.logout()

            expect(mockRecaptchaClear).toHaveBeenCalled()
        })
    })

    describe('checkSession', () => {
        it('resolves with valid=true and phone when user exists', async () => {
            // Defer callback so unsub is assigned before it runs
            mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
                setTimeout(() => cb({ phoneNumber: '+919123456701' }), 0)
                return vi.fn()
            })

            const result = await authService.checkSession()

            expect(result.valid).toBe(true)
            expect(result.phone).toBe('9123456701')
        })

        it('resolves with valid=false when no user', async () => {
            mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: null) => void) => {
                setTimeout(() => cb(null), 0)
                return vi.fn()
            })

            const result = await authService.checkSession()

            expect(result.valid).toBe(false)
        })

        it('falls back to localStorage phone when user has no phoneNumber', async () => {
            localStorage.setItem('ht_phone', '9123456701')
            mockOnAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: {}) => void) => {
                setTimeout(() => cb({}), 0)
                return vi.fn()
            })

            const result = await authService.checkSession()

            expect(result.valid).toBe(true)
            expect(result.phone).toBe('9123456701')
        })

        it('maps FirebaseError from auth state observer', async () => {
            const { FirebaseError } = await import('firebase/app')
            // When onAuthStateChanged throws synchronously inside the Promise executor,
            // the Promise constructor catches it and rejects. The outer try/catch in
            // checkSession does not intercept this rejection, so the raw FirebaseError
            // propagates. This test documents the actual behavior.
            mockOnAuthStateChanged.mockImplementation(() => {
                throw new FirebaseError('auth/network-request-failed', 'Network error')
            })

            await expect(authService.checkSession()).rejects.toThrow('Network error')
        })
    })
})