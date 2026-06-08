import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../state/AuthContext'
import { ProfileProvider, useProfile } from '../state/ProfileContext'

describe('useProfile', () => {
    beforeEach(() => {
        localStorage.clear()
    })

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
        const { result } = renderHook(() => {
            const auth = useAuth()
            const profile = useProfile()
            return { auth, profile }
        }, {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        act(() => {
            result.current.auth.login('9876543210')
        })

        act(() => {
            result.current.profile.initializeProfile({
                name: 'Fresh Driver',
                role: 'driver',
                licenseNumber: 'DL-14201234567',
                truck: {
                    regNumber: 'PB10 AB 4521',
                    type: '19 ft Container',
                    capacity: '9 Ton',
                },
            })
        })

        const truck1 = result.current.profile.driver.trucks.find(t => t.id === '1')
        expect(truck1?.isActive).toBe(true)

        act(() => {
            result.current.profile.toggleTruckActive('1')
        })

        const truck1Toggled = result.current.profile.driver.trucks.find(t => t.id === '1')
        expect(truck1Toggled?.isActive).toBe(false)

        act(() => {
            result.current.profile.toggleTruckActive('1')
        })

        const truck1ToggledBack = result.current.profile.driver.trucks.find(t => t.id === '1')
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

        act(() => {
            result.current.addDriver({
                name: 'Driver One',
                phone: '9876543210',
                licenseNumber: 'DL-14201234567',
            })
        })

        act(() => {
            result.current.addDriver({
                name: 'Driver Two',
                phone: '9876543211',
                licenseNumber: 'DL-14201234568',
            })
        })

        expect(result.current.drivers.length).toBe(2)

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

    it('does not carry a previous account name into a fresh registration', async () => {
        const { result } = renderHook(() => {
            const auth = useAuth()
            const profile = useProfile()
            return { auth, profile }
        }, {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        act(() => {
            result.current.auth.login('9876543210')
        })

        await waitFor(() => {
            expect(result.current.profile.driver.phone).toBe('9876543210')
        })

        act(() => {
            result.current.profile.initializeProfile({
                name: 'Old Driver',
                role: 'driver',
                licenseNumber: 'DL-14201234567',
                truck: {
                    regNumber: 'PB10 AB 4521',
                    type: '19 ft Container',
                    capacity: '9 Ton',
                },
            })
        })

        expect(result.current.profile.driver.name).toBe('Old Driver')

        act(() => {
            result.current.auth.logout()
        })

        await waitFor(() => {
            expect(result.current.profile.driver.name).toBe('')
            expect(result.current.profile.driver.trucks).toHaveLength(0)
        })

        act(() => {
            result.current.auth.login('9123456780')
        })

        await waitFor(() => {
            expect(result.current.profile.driver.phone).toBe('9123456780')
        })

        expect(result.current.profile.driver.name).toBe('')

        act(() => {
            result.current.profile.initializeProfile({
                name: 'New Driver',
                role: 'driver',
                licenseNumber: 'DL-24201234567',
                truck: {
                    regNumber: 'MH12 AB 4521',
                    type: '32 ft Container',
                    capacity: '15 Ton',
                },
            })
        })

        expect(result.current.profile.driver.name).toBe('New Driver')
        expect(result.current.profile.driver.truck.regNumber).toBe('MH12 AB 4521')
        expect(localStorage.getItem('ht_driver')).toBeNull()
    })

    it('does not migrate a legacy profile to a different phone number', async () => {
        localStorage.setItem('ht_driver', JSON.stringify({
            name: 'Legacy Driver',
            phone: '+91 98765 43210',
            rating: 4.8,
            tripsToday: 2,
            earningsToday: 23800,
            walletBalance: 41250,
            truck: {
                regNumber: 'PB10 AB 4521',
                type: '19 ft Container',
                capacity: '9 Ton',
            },
            documents: {
                license: { id: 'DL-14201234567', validity: '15-08-2035' },
                rc: { id: 'PB10 AB 4521', validity: '12-10-2031' },
                permit: { id: 'NP-2026-PB-8841', validity: '31-12-2030' },
            },
            trucks: [
                { id: '1', regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton', isActive: true },
            ],
        }))

        const { result } = renderHook(() => {
            const auth = useAuth()
            const profile = useProfile()
            return { auth, profile }
        }, {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        act(() => {
            result.current.auth.login('9123456780')
        })

        await waitFor(() => {
            expect(result.current.profile.driver.phone).toBe('9123456780')
        })

        expect(result.current.profile.driver.name).toBe('')
        expect(localStorage.getItem('ht_driver_9123456780')).not.toContain('Legacy Driver')
    })

    it('creates a minimal first profile without truck details', async () => {
        const { result } = renderHook(() => {
            const auth = useAuth()
            const profile = useProfile()
            return { auth, profile }
        }, {
            wrapper: ({ children }) => (
                <AuthProvider>
                    <ProfileProvider>{children}</ProfileProvider>
                </AuthProvider>
            ),
        })

        act(() => {
            result.current.auth.login('9988776655')
        })

        await act(async () => {
            await result.current.profile.createDriverProfile({
                name: 'Real Driver',
                phone: '9988776655',
            })
        })

        expect(result.current.profile.driver.name).toBe('Real Driver')
        expect(result.current.profile.driver.phone).toBe('9988776655')
        expect(result.current.profile.driver.truck.regNumber).toBe('')
        expect(result.current.profile.driver.trucks).toHaveLength(0)
        expect(localStorage.getItem('ht_registered_9988776655')).toBe('1')
    })
})
