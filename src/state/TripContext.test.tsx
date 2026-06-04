import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { TripProvider, useTrip } from './TripContext'
import type { Load } from '../data/mockLoads'

const mockLoad: Load = {
    id: 'L1042',
    fromCity: 'Delhi',
    fromArea: 'Okhla Industrial Area',
    toCity: 'Jaipur',
    toArea: 'Sitapura',
    goods: 'electronics',
    weightTon: 9,
    distanceKm: 281,
    price: 18500,
    advance: 6000,
    truckType: '19 ft · 9 Ton',
    shipperName: 'Sharma Electronics',
    shipperVerified: true,
    image: 'https://example.com/electronics.jpg',
}

describe('useTrip', () => {
    it('returns initial idle state', () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })
        expect(result.current.tripStep).toBe(0)
        expect(result.current.activeLoad).toBeNull()
    })

    it('provides acceptLoad function', () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.acceptLoad).toBe('function')
    })

    it('provides advanceTrip function', () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.advanceTrip).toBe('function')
    })

    it('provides resetTrip function', () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.resetTrip).toBe('function')
    })

    it('acceptLoad sets activeLoad and advances from 0', async () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })

        await act(async () => {
            await result.current.acceptLoad(mockLoad)
        })

        expect(result.current.activeLoad).toEqual(mockLoad)
        expect(result.current.tripStep).toBeGreaterThan(0)
    })

    it('resetTrip returns to idle state', async () => {
        const { result } = renderHook(() => useTrip(), {
            wrapper: ({ children }) => (
                <AuthProvider><TripProvider>{children}</TripProvider></AuthProvider>
            ),
        })

        await act(async () => {
            await result.current.acceptLoad(mockLoad)
        })

        act(() => {
            result.current.resetTrip()
        })

        expect(result.current.tripStep).toBe(0)
        expect(result.current.activeLoad).toBeNull()
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useTrip())).toThrow()
    })
})