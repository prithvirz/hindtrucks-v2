// ⚠️ Uses vitest globals only — no import from 'vitest' (globals: true in vitest.config.ts)

const { mockGetDoc, mockOnAuthStateChanged } = vi.hoisted(() => ({
    mockGetDoc: vi.fn(),
    mockOnAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => ['doc', ...args],
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    getFirestore: () => ({}),
}))

vi.mock('firebase/auth', () => ({
    getAuth: () => ({}),
    onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}))

vi.mock('../lib/firebase', () => ({
    app: {},
}))

import {
    checkFirebaseConnection,
    checkAuthConnection,
    runAllHealthChecks,
} from './healthCheck'

describe('healthCheck', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        let call = 0
        vi.spyOn(performance, 'now').mockImplementation(() => {
            call++
            return call === 1 ? 100 : 175
        })
    })

    describe('checkFirebaseConnection', () => {
        it('returns connected=true with latency on success', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false })

            const result = await checkFirebaseConnection()

            expect(result.connected).toBe(true)
            expect(result.latency).toBe(75)
            expect(result.error).toBeUndefined()
        })

        it('returns connected=false with error message on failure', async () => {
            mockGetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'))

            const result = await checkFirebaseConnection()

            expect(result.connected).toBe(false)
            expect(result.error).toBe('Firestore unavailable')
        })

        it('handles non-Error rejections gracefully', async () => {
            mockGetDoc.mockRejectedValueOnce('unknown string error')

            const result = await checkFirebaseConnection()

            expect(result.connected).toBe(false)
            expect(result.error).toBe('Unknown Firestore error')
        })
    })

    describe('checkAuthConnection', () => {
        it('returns connected=true when user is present', async () => {
            mockOnAuthStateChanged.mockImplementation(
                (_auth: unknown, cb: (u: unknown) => void) => {
                    setTimeout(() => cb({ uid: 'user1' }), 0)
                    return vi.fn()
                }
            )

            const result = await checkAuthConnection()

            expect(result.connected).toBe(true)
        })

        it('returns connected=false when no user', async () => {
            mockOnAuthStateChanged.mockImplementation(
                (_auth: unknown, cb: (u: null) => void) => {
                    setTimeout(() => cb(null), 0)
                    return vi.fn()
                }
            )

            const result = await checkAuthConnection()

            expect(result.connected).toBe(false)
        })

        it('returns error on auth state observer failure', async () => {
            mockOnAuthStateChanged.mockImplementation(
                (_auth: unknown, _cb: unknown, errCb: (e: Error) => void) => {
                    setTimeout(() => errCb(new Error('Auth service down')), 0)
                    return vi.fn()
                }
            )

            const result = await checkAuthConnection()

            expect(result.connected).toBe(false)
            expect(result.error).toBe('Auth service down')
        })
    })

    describe('runAllHealthChecks', () => {
        it('runs both checks in parallel', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false })
            mockOnAuthStateChanged.mockImplementation(
                (_auth: unknown, cb: (u: unknown) => void) => {
                    setTimeout(() => cb({ uid: 'user1' }), 0)
                    return vi.fn()
                }
            )

            const result = await runAllHealthChecks()

            expect(result.firestore.connected).toBe(true)
            expect(result.auth.connected).toBe(true)
        })
    })
})