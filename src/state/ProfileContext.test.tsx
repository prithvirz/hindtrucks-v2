import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from '../state/AuthContext'
import { ProfileProvider, useProfile } from '../state/ProfileContext'

describe('useProfile', () => {
    it('returns driver object on initial render', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(result.current.driver).toBeDefined()
        expect(result.current.driver.name).toBeDefined()
        expect(result.current.driver.rating).toBeGreaterThan(0)
    })

    it('provides setOnline function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.setOnline).toBe('function')
    })

    it('provides updateDriver function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.updateDriver).toBe('function')
    })

    it('provides addTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.addTruck).toBe('function')
    })

    it('provides removeTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.removeTruck).toBe('function')
    })

    it('provides setActiveTruck function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(typeof result.current.setActiveTruck).toBe('function')
    })

    it('provides role and setRole function', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(result.current.role).toBe('driver')
        expect(typeof result.current.setRole).toBe('function')
    })

    it('provides drivers and driver management functions', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })
        expect(Array.isArray(result.current.drivers)).toBe(true)
        expect(typeof result.current.addDriver).toBe('function')
        expect(typeof result.current.removeDriver).toBe('function')
        expect(typeof result.current.assignDriverToTruck).toBe('function')
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useProfile())).toThrow()
    })

    it('toggles a truck active status correctly', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        const truck1 = result.current.driver.trucks.find(t => t.id === '1')
        expect(truck1?.isActive).toBe(true)

        act(() => {
            result.current.toggleTruckActive('1')
        })

        const truck1Toggled = result.current.driver.trucks.find(t => t.id === '1')
        expect(truck1Toggled?.isActive).toBe(false)

        act(() => {
            result.current.toggleTruckActive('1')
        })

        const truck1ToggledBack = result.current.driver.trucks.find(t => t.id === '1')
        expect(truck1ToggledBack?.isActive).toBe(true)
    })

    it('allows assigning multiple drivers to the same truck registration ID', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        expect(result.current.drivers.length).toBeGreaterThan(1)

        const driver1Id = result.current.drivers[0].id
        const driver2Id = result.current.drivers[1].id
        const truckId = '1'

        act(() => {
            result.current.assignDriverToTruck(driver1Id, truckId)
        })

        act(() => {
            result.current.assignDriverToTruck(driver2Id, truckId)
        })

        const d1 = result.current.drivers.find(d => d.id === driver1Id)
        const d2 = result.current.drivers.find(d => d.id === driver2Id)

        expect(d1?.assignedTruckId).toBe(truckId)
        expect(d2?.assignedTruckId).toBe(truckId)
    })
})