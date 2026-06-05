import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DRIVER } from '../data/mockLoads'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'
import { type UserRole, type Driver } from './types'

const DEFAULT_DRIVER = {
    ...DRIVER,
    avatarId: '1633332755192-727a05c4013d',
    documents: {
        license: { id: 'DL-0420 1198 7654', validity: '15-08-2035' },
        rc: { id: 'PB10 AB 4521', validity: '12-10-2031' },
        permit: { id: 'NP-2026-PB-8841', validity: '31-12-2030' },
    },
    trucks: [
        { id: '1', regNumber: 'PB10 AB 4521', type: '19 ft Container', capacity: '9 Ton', isActive: true },
        { id: '2', regNumber: 'HR55 CX 8812', type: '32 ft Container', capacity: '15 Ton', isActive: true },
    ],
}

const DEFAULT_DRIVERS: Driver[] = [
    { id: 'd1', name: 'Rajesh Kumar', phone: '+91 98765 43210', licenseNumber: 'DL-14201234567', assignedTruckId: '1' },
    { id: 'd2', name: 'Gurpreet Singh', phone: '+91 87654 32109', licenseNumber: 'DL-12201987654', assignedTruckId: '2' },
]

export type DriverWithExtras = typeof DEFAULT_DRIVER

interface ProfileState {
    driver: DriverWithExtras
    isOnline: boolean
    isLoading: boolean
    error: ApiError | null
    setOnline: (v: boolean) => void
    updateDriver: (updated: Partial<DriverWithExtras>) => void
    addTruck: (truck: { regNumber: string; type: string; capacity: string }) => void
    removeTruck: (truckId: string) => void
    setActiveTruck: (truckId: string) => void
    toggleTruckActive: (truckId: string) => void
    role: UserRole
    setRole: (role: UserRole) => void
    drivers: Driver[]
    addDriver: (driver: { name: string; phone: string; licenseNumber: string }) => void
    removeDriver: (driverId: string) => void
    assignDriverToTruck: (driverId: string, truckId: string | null) => void
    initializeProfile: (params: {
        name: string
        role: UserRole
        licenseNumber?: string
        companyName?: string
        truck: {
            regNumber: string
            type: string
            capacity: string
        }
    }) => void
}

const ProfileCtx = createContext<ProfileState | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn, phone } = useAuth()
    const [isOnline, setOnlineState] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    const [role, setRoleState] = useState<UserRole>(() => {
        const saved = localStorage.getItem('ht_user_role')
        return (saved as UserRole) || 'driver'
    })

    const [drivers, setDrivers] = useState<Driver[]>(() => {
        const saved = localStorage.getItem('ht_owner_drivers')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                // Fall through
            }
        }
        return DEFAULT_DRIVERS
    })

    const [driver, setDriver] = useState<DriverWithExtras>(() => {
        const saved = localStorage.getItem('ht_driver')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (parsed && Array.isArray(parsed.trucks) && parsed.documents) {
                    return { ...DEFAULT_DRIVER, ...parsed }
                }
            } catch {
                // Fall through
            }
        }
        return DEFAULT_DRIVER
    })

    // Load profile from service on mount (mock returns same data)
    useEffect(() => {
        if (isLoggedIn) {
            setIsLoading(true)
            import('../services/index')
                .then(({ profileService }) => profileService.getProfile())
                .then(({ profile }) => {
                    setDriver((prev) => ({
                        ...prev,
                        name: profile.name,
                        phone: profile.phone,
                        rating: profile.rating,
                        tripsToday: profile.tripsToday,
                        earningsToday: profile.earningsToday,
                        truck: {
                            regNumber: profile.truck.regNumber,
                            type: profile.truck.type,
                            capacity: profile.truck.capacity,
                        },
                    }))
                })
                .catch((err) => {
                    if (err instanceof ApiError) setError(err)
                })
                .finally(() => setIsLoading(false))
        }
    }, [isLoggedIn])

    // Persist driver updates
    useEffect(() => {
        localStorage.setItem('ht_driver', JSON.stringify(driver))
    }, [driver])

    useEffect(() => {
        localStorage.setItem('ht_user_role', role)
    }, [role])

    useEffect(() => {
        localStorage.setItem('ht_owner_drivers', JSON.stringify(drivers))
    }, [drivers])

    // Self-cleanup on logout
    useEffect(() => {
        if (!isLoggedIn) {
            setOnlineState(false)
            setDriver(DEFAULT_DRIVER)
            setRoleState('driver')
            setDrivers(DEFAULT_DRIVERS)
            setError(null)
            localStorage.removeItem('ht_driver')
            localStorage.removeItem('ht_user_role')
            localStorage.removeItem('ht_owner_drivers')
        }
    }, [isLoggedIn])

    const setRole = (r: UserRole) => {
        setRoleState(r)
    }

    const addDriver = (newDriver: { name: string; phone: string; licenseNumber: string }) => {
        setDrivers((prev) => [
            ...prev,
            {
                ...newDriver,
                id: 'd_' + Date.now(),
                assignedTruckId: null,
            },
        ])
    }

    const removeDriver = (driverId: string) => {
        setDrivers((prev) => prev.filter((d) => d.id !== driverId))
    }

    const assignDriverToTruck = (driverId: string, truckId: string | null) => {
        setDrivers((prev) =>
            prev.map((d) => {
                if (d.id === driverId) {
                    return { ...d, assignedTruckId: truckId }
                }
                return d
            })
        )
    }

    const setOnline = async (v: boolean) => {
        setError(null)
        setOnlineState(v)
        // Sync with service (fire-and-forget)
        import('../services/index')
            .then(({ profileService }) => profileService.setOnlineStatus({ isOnline: v }))
            .catch((err) => {
                if (err instanceof ApiError) setError(err)
                setOnlineState(!v) // Revert on failure
            })
    }

    const updateDriver = (updated: Partial<DriverWithExtras>) => {
        setDriver((prev) => {
            const next = { ...prev, ...updated }
            if (updated.truck) {
                next.truck = { ...prev.truck, ...updated.truck }
            }
            if (updated.documents) {
                next.documents = { ...prev.documents, ...updated.documents }
            }
            return next
        })
    }

    const addTruck = (newTruck: { regNumber: string; type: string; capacity: string }) => {
        setDriver((prev) => {
            const truckWithId = {
                ...newTruck,
                id: String(Date.now()),
                isActive: true,
            }
            return {
                ...prev,
                trucks: [...prev.trucks, truckWithId],
            }
        })
    }

    const removeTruck = (truckId: string) => {
        setDriver((prev) => {
            const targetTruck = prev.trucks.find((t) => t.id === truckId)
            if (targetTruck && targetTruck.regNumber === prev.truck.regNumber) {
                return prev // Cannot delete currently active truck
            }
            return {
                ...prev,
                trucks: prev.trucks.filter((t) => t.id !== truckId),
            }
        })
    }

    const setActiveTruck = (truckId: string) => {
        setDriver((prev) => {
            const selected = prev.trucks.find((t) => t.id === truckId)
            if (!selected) return prev
            return {
                ...prev,
                truck: {
                    regNumber: selected.regNumber,
                    type: selected.type,
                    capacity: selected.capacity,
                },
                documents: {
                    ...prev.documents,
                    rc: {
                        ...prev.documents.rc,
                        id: selected.regNumber,
                    },
                },
            }
        })
    }

    const toggleTruckActive = (truckId: string) => {
        setDriver((prev) => ({
            ...prev,
            trucks: prev.trucks.map((t) => {
                if (t.id === truckId) {
                    return { ...t, isActive: !t.isActive }
                }
                return t
            }),
        }))
    }

    const initializeProfile = (params: {
        name: string
        role: UserRole
        licenseNumber?: string
        companyName?: string
        truck: {
            regNumber: string
            type: string
            capacity: string
        }
    }) => {
        const newProfile: DriverWithExtras = {
            ...DEFAULT_DRIVER,
            name: params.name,
            phone: phone,
            rating: 5.0,
            tripsToday: 0,
            earningsToday: 0,
            walletBalance: 0,
            truck: {
                regNumber: params.truck.regNumber.toUpperCase(),
                type: params.truck.type,
                capacity: params.truck.capacity,
            },
            trucks: [
                {
                    id: '1',
                    regNumber: params.truck.regNumber.toUpperCase(),
                    type: params.truck.type,
                    capacity: params.truck.capacity,
                    isActive: true,
                }
            ],
            documents: {
                license: { id: params.licenseNumber || 'PENDING', validity: '15-08-2035' },
                rc: { id: params.truck.regNumber.toUpperCase(), validity: '12-10-2031' },
                permit: { id: 'NP-' + Date.now().toString().slice(-6), validity: '31-12-2030' },
            }
        }
        setDriver(newProfile)
        setRoleState(params.role)
        if (params.role === 'owner') {
            setDrivers([]) // Starts with empty fleet drivers
        } else {
            setDrivers(DEFAULT_DRIVERS)
        }
        localStorage.setItem('ht_registered_' + phone, '1')

        // Initialize ₹1,500 Signup Welcome Bonus
        import('../services/mock/earningsService').then(({ setMockWalletBalance, clearMockPayouts, addMockPayout }) => {
            setMockWalletBalance(1500)
            clearMockPayouts()
            addMockPayout({
                id: 'P9000',
                load: 'BONUS',
                route: 'Signup Bonus - Welcome to HindTrucks',
                amount: 1500,
                status: 'credited',
                date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
            })
        }).catch((err) => {
            console.error('Failed to initialize mock signup bonus:', err)
        })
    }

    return (
        <ProfileCtx.Provider
            value={{
                driver,
                isOnline,
                isLoading,
                error,
                setOnline,
                updateDriver,
                addTruck,
                removeTruck,
                setActiveTruck,
                toggleTruckActive,
                role,
                setRole,
                drivers,
                addDriver,
                removeDriver,
                assignDriverToTruck,
                initializeProfile,
            }}
        >
            {children}
        </ProfileCtx.Provider>
    )
}

export function useProfile(): ProfileState {
    const ctx = useContext(ProfileCtx)
    if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
    return ctx
}