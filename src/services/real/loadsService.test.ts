// ⚠️ Uses vitest globals only — no import from 'vitest' (globals: true in vitest.config.ts)

const { mockGetDocs, mockGetDoc, mockUpdateDoc, mockServerTimestamp } = vi.hoisted(() => ({
    mockGetDocs: vi.fn(),
    mockGetDoc: vi.fn(),
    mockUpdateDoc: vi.fn(() => Promise.resolve()),
    mockServerTimestamp: vi.fn(() => ({ _seconds: 0, _nanoseconds: 0 })),
}))

vi.mock('firebase/firestore', () => ({
    collection: (...args: unknown[]) => ['collection', ...args],
    doc: (...args: unknown[]) => ['doc', ...args],
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    query: (...args: unknown[]) => ['query', ...args],
    where: (...args: unknown[]) => ['where', ...args],
    orderBy: (...args: unknown[]) => ['orderBy', ...args],
    limit: (n: number) => ['limit', n],
    updateDoc: mockUpdateDoc,
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

import { loadsService } from './loadsService'
import { AuthError, ApiError } from '../errors'
import type { Load } from '../../data/mockLoads'

const makeLoadDoc = (overrides: Partial<Load> = {}): Load => ({
    id: 'load_1',
    fromCity: 'Mumbai',
    fromArea: 'BKC',
    toCity: 'Delhi',
    toArea: 'CP',
    goods: 'electronics' as Load['goods'],
    weightTon: 5,
    distanceKm: 1400,
    price: 25000,
    advance: 5000,
    truckType: 'container',
    shipperName: 'Test Shipper',
    shipperVerified: true,
    image: '',
    ...overrides,
})

describe('real loadsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getLoads', () => {
        it('queries available loads and maps documents', async () => {
            const load = makeLoadDoc()
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    { id: 'load_1', data: () => ({ ...load, status: 'available', createdAt: null }) },
                ],
            })

            const result = await loadsService.getLoads()

            expect(result.data.length).toBe(1)
            expect(result.data[0]).toMatchObject({
                id: 'load_1',
                fromCity: 'Mumbai',
                toCity: 'Delhi',
                price: 25000,
            })
            expect(result.total).toBe(1)
        })

        it('filters by goods when provided', async () => {
            mockGetDocs.mockResolvedValueOnce({ docs: [] })

            await loadsService.getLoads({ goods: 'electronics' })

            const queryArgs = mockGetDocs.mock.calls[0][0]
            expect(queryArgs).toContainEqual(['where', 'goods', '==', 'electronics'])
        })

        it('filters by price range client-side', async () => {
            const cheap = makeLoadDoc({ id: 'cheap', price: 5000 })
            const expensive = makeLoadDoc({ id: 'expensive', price: 50000 })
            mockGetDocs.mockResolvedValueOnce({
                docs: [
                    { id: 'cheap', data: () => ({ ...cheap, status: 'available' }) },
                    { id: 'expensive', data: () => ({ ...expensive, status: 'available' }) },
                ],
            })

            const result = await loadsService.getLoads({ minPrice: 10000, maxPrice: 30000 })

            expect(result.data.length).toBe(0)
        })

        it('maps FirebaseError to ApiError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockGetDocs.mockRejectedValueOnce(
                new FirebaseError('permission-denied', 'No access')
            )

            await expect(loadsService.getLoads()).rejects.toThrow(AuthError)
        })
    })

    describe('getLoadDetail', () => {
        it('returns load when document exists', async () => {
            const load = makeLoadDoc()
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                id: 'load_1',
                data: () => ({ ...load, status: 'available' }),
            })

            const result = await loadsService.getLoadDetail({ loadId: 'load_1' })

            expect(result.load.id).toBe('load_1')
            expect(result.load.fromCity).toBe('Mumbai')
        })

        it('throws when load is not found', async () => {
            mockGetDoc.mockResolvedValueOnce({
                exists: () => false,
                id: 'load_99',
                data: () => null,
            })

            await expect(loadsService.getLoadDetail({ loadId: 'load_99' }))
                .rejects.toThrow('Load not found')
        })
    })

    describe('acceptLoad', () => {
        it('accepts an available load and returns trip step 1', async () => {
            const load = makeLoadDoc()
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                id: 'load_1',
                data: () => ({ ...load, status: 'available' }),
            })

            const result = await loadsService.acceptLoad({ loadId: 'load_1' })

            expect(result.success).toBe(true)
            expect(result.tripStep).toBe(1)
            expect(result.activeLoad.id).toBe('load_1')
            expect(mockUpdateDoc).toHaveBeenCalledTimes(1)
        })

        it('throws when load is already taken', async () => {
            const load = makeLoadDoc()
            mockGetDoc.mockResolvedValueOnce({
                exists: () => true,
                id: 'load_1',
                data: () => ({ ...load, status: 'accepted' }),
            })

            await expect(loadsService.acceptLoad({ loadId: 'load_1' }))
                .rejects.toThrow('Load already taken')
        })

        it('maps not-found FirebaseError to ApiError', async () => {
            const { FirebaseError } = await import('firebase/app')
            mockGetDoc.mockRejectedValueOnce(
                new FirebaseError('not-found', 'Document not found')
            )

            await expect(loadsService.acceptLoad({ loadId: 'load_99' }))
                .rejects.toThrow(ApiError)
        })
    })
})