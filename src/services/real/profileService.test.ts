// ⚠️ Uses vitest globals only — no import from 'vitest' (globals: true in vitest.config.ts)

const { mockGetDoc, mockSetDoc, mockServerTimestamp } = vi.hoisted(() => ({
    mockGetDoc: vi.fn(),
    mockSetDoc: vi.fn(() => Promise.resolve()),
    mockServerTimestamp: vi.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
}))

vi.mock('firebase/firestore', () => ({
    doc: (...args: unknown[]) => ['doc', ...args],
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    setDoc: mockSetDoc,
    serverTimestamp: () => mockServerTimestamp(),
}))

vi.mock('../../lib/firebase', () => ({
    auth: { currentUser: { uid: 'test_driver_uid' } },
    db: {},
}))

vi.mock('firebase/app', () => ({
    FirebaseError: class extends Error {
        code: string
        constructor(code: string, message: string) {
            super(message)
            this.code = code
            this.name = 'FirebaseError'
        }
    },
}))

import { profileService } from './profileService'
import { AuthError } from '../errors'

const makeDriverData = () => ({
    name: 'Rajesh Kumar',
    phone: '+919123456701',
    rating: 4.8,
    tripsToday: 3,
    earningsToday: 4500,
    truckRegNumber: 'MH01AB1234',
    truckType: 'container',
    truckCapacity: '20 Ton',
})

describe('real profileService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getProfile', () => {
        it('returns profile when driver doc exists', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => makeDriverData(),
            })

            const result = await profileService.getProfile()

            expect(result.profile.name).toBe('Rajesh Kumar')
            expect(result.profile.phone).toBe('+919123456701')
            expect(result.profile.rating).toBe(4.8)
            expect(result.profile.tripsToday).toBe(3)
            expect(result.profile.earningsToday).toBe(4500)
            expect(result.profile.truck.regNumber).toBe('MH01AB1234')
            expect(result.profile.truck.type).toBe('container')
            expect(result.profile.truck.capacity).toBe('20 Ton')
        })

        it('uses defaults for missing fields', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                data: () => ({}),
            })

            const result = await profileService.getProfile()

            expect(result.profile.name).toBe('')
            expect(result.profile.rating).toBe(5.0)
            expect(result.profile.tripsToday).toBe(0)
        })

        it('throws when profile doc does not exist', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => false,
                data: () => null,
            })

            await expect(profileService.getProfile()).rejects.toThrow('Profile not found')
        })

        it('maps FirebaseError to AuthError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockGetDoc.mockRejectedValueOnce(
                new FirebaseError('permission-denied', 'Forbidden')
            )

            await expect(profileService.getProfile()).rejects.toThrow(AuthError)
        })
    })

    describe('getRegistrationStatus', () => {
        it('returns registered=true when doc exists', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => true })

            const result = await profileService.getRegistrationStatus()

            expect(result.registered).toBe(true)
        })

        it('returns registered=false when doc does not exist', async () => {
            mockGetDoc.mockResolvedValueOnce({ exists: () => false })

            const result = await profileService.getRegistrationStatus()

            expect(result.registered).toBe(false)
        })
    })

    describe('createDriverProfile', () => {
        it('creates profile and wallet documents', async () => {
            const result = await profileService.createDriverProfile({
                name: 'New Driver',
                phone: '+919876543210',
            })

            expect(result.profile.name).toBe('New Driver')
            expect(result.profile.phone).toBe('+919876543210')
            expect(result.profile.rating).toBe(5.0)
            expect(mockSetDoc).toHaveBeenCalledTimes(2)
        })

        it('maps FirebaseError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockSetDoc.mockRejectedValueOnce(
                new FirebaseError('unavailable', 'Down')
            )

            await expect(
                profileService.createDriverProfile({ name: 'X', phone: '+910000000000' })
            ).rejects.toThrow(/Down/)
        })
    })

    describe('setOnlineStatus', () => {
        it('sets isOnline via merge update', async () => {
            const result = await profileService.setOnlineStatus({ isOnline: true })

            expect(result.isOnline).toBe(true)
            expect(mockSetDoc).toHaveBeenCalledTimes(1)
            const callArgs = mockSetDoc.mock.calls[0] as unknown[]
            expect(callArgs[2]).toEqual({ merge: true })
        })

        it('sets isOnline to false', async () => {
            const result = await profileService.setOnlineStatus({ isOnline: false })

            expect(result.isOnline).toBe(false)
        })
    })
})