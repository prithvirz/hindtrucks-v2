import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'
import { type UserRole, type Driver } from './types'

const DEFAULT_DRIVER = {
    name: '',
    phone: '',
    rating: 5.0,
    tripsToday: 0,
    earningsToday: 0,
    walletBalance: 0,
    truck: {
        regNumber: '',
        type: '19 ft Container',
        capacity: '9 Ton',
    },
    avatarId: '1633332755192-727a05c4013d',
    documents: {
        license: { id: 'PENDING', validity: '15-08-2035' },
        rc: { id: 'PENDING', validity: '12-10-2031' },
        permit: { id: 'PENDING', validity: '31-12-2030' },
    },
    trucks: [] as Array<{ id: string; regNumber: string; type: string; capacity: string; isActive: boolean }>,
}

const DEFAULT_DRIVERS: Driver[] = []

export type DriverWithExtras = typeof DEFAULT_DRIVER

const LEGACY_DRIVER_KEY = 'ht_driver'
const LEGACY_ROLE_KEY = 'ht_user_role'
const LEGACY_OWNER_DRIVERS_KEY = 'ht_owner_drivers'

const driverKey = (phone: string) => `ht_driver_${phone}`
const roleKey = (phone: string) => `ht_user_role_${phone}`
const ownerDriversKey = (phone: string) => `ht_owner_drivers_${phone}`
const registeredKey = (phone: string) => `ht_registered_${phone}`

function createDefaultDriver(phone = ''): DriverWithExtras {
    return {
        ...DEFAULT_DRIVER,
        phone,
        truck: { ...DEFAULT_DRIVER.truck },
        documents: {
            license: { ...DEFAULT_DRIVER.documents.license },
            rc: { ...DEFAULT_DRIVER.documents.rc },
            permit: { ...DEFAULT_DRIVER.documents.permit },
        },
        trucks: [],
    }
}

function parseStoredDriver(value: string | null, phone: string): DriverWithExtras | null {
    if (!value) return null
    try {
        const parsed = JSON.parse(value)
        if (!parsed || !Array.isArray(parsed.trucks) || !parsed.documents) return null
        const base = createDefaultDriver(phone)
        return {
            ...base,
            ...parsed,
            phone: parsed.phone || phone,
            truck: { ...base.truck, ...parsed.truck },
            documents: {
                license: { ...base.documents.license, ...parsed.documents.license },
                rc: { ...base.documents.rc, ...parsed.documents.rc },
                permit: { ...base.documents.permit, ...parsed.documents.permit },
            },
            trucks: parsed.trucks,
        }
    } catch {
        return null
    }
}

function readStoredDrivers(phone: string): Driver[] {
    const saved = localStorage.getItem(ownerDriversKey(phone))
    if (!saved) return DEFAULT_DRIVERS
    try {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : DEFAULT_DRIVERS
    } catch {
        return DEFAULT_DRIVERS
    }
}

function readStoredRole(phone: string): UserRole {
    const saved = localStorage.getItem(roleKey(phone))
    return saved === 'owner' || saved === 'driver' ? saved : 'driver'
}

function clearLegacyActiveProfile() {
    localStorage.removeItem(LEGACY_DRIVER_KEY)
    localStorage.removeItem(LEGACY_ROLE_KEY)
    localStorage.removeItem(LEGACY_OWNER_DRIVERS_KEY)
}

function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '')
    return digits.length > 10 ? digits.slice(-10) : digits
}

function migrateLegacyProfileForPhone(phone: string): DriverWithExtras | null {
    const legacyProfile = parseStoredDriver(localStorage.getItem(LEGACY_DRIVER_KEY), phone)
    if (!legacyProfile) return null

    if (normalizePhone(legacyProfile.phone) !== normalizePhone(phone)) {
        return null
    }

    localStorage.setItem(driverKey(phone), JSON.stringify(legacyProfile))

    const legacyRole = localStorage.getItem(LEGACY_ROLE_KEY)
    if (legacyRole === 'owner' || legacyRole === 'driver') {
        localStorage.setItem(roleKey(phone), legacyRole)
    }

    const legacyDrivers = localStorage.getItem(LEGACY_OWNER_DRIVERS_KEY)
    if (legacyDrivers) {
        localStorage.setItem(ownerDriversKey(phone), legacyDrivers)
    }

    clearLegacyActiveProfile()
    return legacyProfile
}

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
    refreshProfile: () => Promise<void>
}

const ProfileCtx = createContext<ProfileState | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn, phone } = useAuth()
    const [isOnline, setOnlineState] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    const [role, setRoleState] = useState<UserRole>('driver')
    const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS)
    const [driver, setDriver] = useState<DriverWithExtras>(() => createDefaultDriver())

    // Load the active account profile from phone-scoped storage. Mock profiles
    // are intentionally not fetched here because they contain demo identities.
    useEffect(() => {
        let cancelled = false

        if (!isLoggedIn || !phone) {
            setOnlineState(false)
            setDriver(createDefaultDriver())
            setRoleState('driver')
            setDrivers(DEFAULT_DRIVERS)
            setError(null)
            setIsLoading(false)
            clearLegacyActiveProfile()
            return () => {
                cancelled = true
            }
        }

        const stored =
            parseStoredDriver(localStorage.getItem(driverKey(phone)), phone) ||
            migrateLegacyProfileForPhone(phone)
        setDriver(stored || createDefaultDriver(phone))
        setRoleState(readStoredRole(phone))
        setDrivers(readStoredDrivers(phone))
        setError(null)

        if (
            import.meta.env.VITE_API_MODE === 'real' &&
            localStorage.getItem(registeredKey(phone)) === '1'
        ) {
            setIsLoading(true)
            import('../services/index')
                .then(({ profileService }) => profileService.getProfile())
                .then(({ profile }) => {
                    if (cancelled) return
                    setDriver((prev) => ({
                        ...prev,
                        name: profile.name || prev.name,
                        phone: profile.phone || phone,
                        rating: profile.rating,
                        tripsToday: profile.tripsToday,
                        earningsToday: profile.earningsToday,
                        truck: {
                            regNumber: profile.truck.regNumber || prev.truck.regNumber,
                            type: profile.truck.type || prev.truck.type,
                            capacity: profile.truck.capacity || prev.truck.capacity,
                        },
                    }))
                })
                .catch((err) => {
                    if (!cancelled && err instanceof ApiError) setError(err)
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false)
                })
        }

        return () => {
            cancelled = true
        }
    }, [isLoggedIn, phone])

    // Persist driver updates
    useEffect(() => {
        if (isLoggedIn && phone) {
            localStorage.setItem(driverKey(phone), JSON.stringify(driver))
        }
    }, [driver, isLoggedIn, phone])

    useEffect(() => {
        if (isLoggedIn && phone) {
            localStorage.setItem(roleKey(phone), role)
        }
    }, [role, isLoggedIn, phone])

    useEffect(() => {
        if (isLoggedIn && phone) {
            localStorage.setItem(ownerDriversKey(phone), JSON.stringify(drivers))
        }
    }, [drivers, isLoggedIn, phone])

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

    const refreshProfile = async () => {
        if (import.meta.env.VITE_API_MODE !== 'real') return
        setIsLoading(true)
        setError(null)
        try {
            const { profileService } = await import('../services/index')
            const { profile } = await profileService.getProfile()
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
        } catch (err) {
            if (err instanceof ApiError) setError(err)
        } finally {
            setIsLoading(false)
        }
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
        if (!phone) return
        const newProfile: DriverWithExtras = {
            ...createDefaultDriver(phone),
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
        const nextDrivers = DEFAULT_DRIVERS
        setDriver(newProfile)
        setRoleState(params.role)
        setDrivers(nextDrivers)
        localStorage.setItem(registeredKey(phone), '1')
        localStorage.setItem(driverKey(phone), JSON.stringify(newProfile))
        localStorage.setItem(roleKey(phone), params.role)
        localStorage.setItem(ownerDriversKey(phone), JSON.stringify(nextDrivers))
        clearLegacyActiveProfile()

        const apiMode = import.meta.env.VITE_API_MODE
        if (apiMode === 'real') {
            import('../lib/firebase').then(({ auth, saveDriverToFirestore }) => {
                const uid = auth.currentUser?.uid
                if (!uid) return
                saveDriverToFirestore({
                    uid,
                    name: params.name,
                    phone,
                    role: params.role,
                    licenseNumber: params.licenseNumber,
                    truckRegNumber: params.truck.regNumber.toUpperCase(),
                    truckType: params.truck.type,
                    truckCapacity: params.truck.capacity,
                }).catch(console.error)
            })
        } else {
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
            }).catch(console.error)
        }
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
                refreshProfile,
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
