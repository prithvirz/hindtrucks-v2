import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { type Load } from '../data/mockLoads'
import { type TripStep, type ActiveTrip } from './types'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'
import type { Coordinates, RouteWaypoint, TrackingState } from '../features/tracking/types'
import { useRouteTracking } from '../features/tracking/hooks/useRouteTracking'
import { addOfflineAction } from '../features/offline/services/offlineStorage'

interface TripState {
    activeLoad: Load | null
    tripStep: TripStep
    activeTrips: ActiveTrip[]
    isLoading: boolean
    error: ApiError | null
    acceptLoad: (load: Load) => void
    advanceTrip: () => void
    resetTrip: () => void
    acceptLoadOwner: (load: Load, truckId: string, driverId: string) => void
    advanceTripOwner: (tripId: string) => void
    resetTripOwner: (tripId: string) => void
    trackingState: TrackingState
    startTracking: (waypoints: RouteWaypoint[], route: Coordinates[]) => void
    stopTracking: () => void
    updateDriverPosition: (position: Coordinates) => void
}

const TripCtx = createContext<TripState | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn } = useAuth()
    const [activeLoad, setActiveLoad] = useState<Load | null>(null)
    const [tripStep, setTripStep] = useState<TripStep>(0)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)
    const { trackingState, startTracking, stopTracking, updateDriverPosition } = useRouteTracking()
    const lastReportedTsRef = useRef<number | null>(null)

    const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>(() => {
        const saved = localStorage.getItem('ht_active_trips')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                // Fall through
            }
        }
        return []
    })

    useEffect(() => {
        localStorage.setItem('ht_active_trips', JSON.stringify(activeTrips))
    }, [activeTrips])

    // Self-cleanup on logout
    useEffect(() => {
        if (!isLoggedIn) {
            stopTracking() // tear down the native foreground service / watcher
            lastReportedTsRef.current = null
            setActiveLoad(null)
            setTripStep(0)
            setActiveTrips([])
            setError(null)
            localStorage.removeItem('ht_active_trips')
        }
    }, [isLoggedIn, stopTracking])

    // Buffer each new GPS fix into the offline queue while a trip is active.
    // The watcher keeps producing fixes in the background (foreground service),
    // and the offline queue flushes them to the backend when online.
    useEffect(() => {
        const pos = trackingState.driverPosition
        if (!pos || !trackingState.isTracking || !activeLoad) return
        if (lastReportedTsRef.current === pos.timestamp) return
        lastReportedTsRef.current = pos.timestamp

        addOfflineAction({
            id: `loc-${pos.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'report_location',
            endpoint: `/driver/trips/${activeLoad.id}/location`,
            method: 'POST',
            payload: {
                loadId: activeLoad.id,
                lat: pos.lat,
                lng: pos.lng,
                accuracy: pos.accuracy ?? null,
                heading: pos.heading ?? null,
                speed: pos.speed ?? null,
                recordedAt: pos.timestamp,
            },
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 5,
            lastAttemptAt: null,
            status: 'pending',
        }).catch(() => undefined)
    }, [trackingState.driverPosition, trackingState.isTracking, activeLoad])

    const acceptLoad = async (load: Load) => {
        setError(null)
        setIsLoading(true)
        // Fire-and-forget service call in background
        import('../services/index')
            .then(({ tripService }) => tripService.advanceStep({ currentStep: 0 }))
            .catch((err) => {
                if (err instanceof ApiError) setError(err)
            })
            .finally(() => setIsLoading(false))

        setActiveLoad(load)
        setTripStep(1)

        setActiveTrips((prev) => [
            ...prev.filter((t) => t.driverId !== 'self'),
            {
                id: 't_self',
                load,
                truckId: '1',
                driverId: 'self',
                step: 1,
            },
        ])
    }

    const advanceTrip = () => {
        setError(null)
        setIsLoading(true)
        setTripStep((s) => {
            const newStep = s < 4 ? ((s + 1) as TripStep) : s
            // Sync with service in background
            import('../services/index')
                .then(({ tripService }) => tripService.advanceStep({ currentStep: s }))
                .then((result) => {
                    if (result.newStep !== newStep) {
                        setTripStep(result.newStep)
                        setActiveTrips((prev) =>
                            prev.map((t) => (t.driverId === 'self' ? { ...t, step: result.newStep } : t))
                        )
                    }
                })
                .catch((err) => {
                    if (err instanceof ApiError) setError(err)
                })
                .finally(() => setIsLoading(false))

            setActiveTrips((prev) =>
                prev.map((t) => (t.driverId === 'self' ? { ...t, step: newStep } : t))
            )
            return newStep
        })
    }

    const resetTrip = () => {
        setError(null)
        setActiveLoad(null)
        setTripStep(0)
        setActiveTrips((prev) => prev.filter((t) => t.driverId !== 'self'))
    }

    const acceptLoadOwner = (load: Load, truckId: string, driverId: string) => {
        const tripId = 't_' + Date.now()
        setActiveTrips((prev) => [
            ...prev,
            {
                id: tripId,
                load,
                truckId,
                driverId,
                step: 1,
            },
        ])
    }

    const advanceTripOwner = (tripId: string) => {
        setActiveTrips((prev) =>
            prev.map((t) => {
                if (t.id === tripId) {
                    const nextStep = t.step < 4 ? ((t.step + 1) as TripStep) : t.step
                    return { ...t, step: nextStep }
                }
                return t
            })
        )
    }

    const resetTripOwner = (tripId: string) => {
        setActiveTrips((prev) => prev.filter((t) => t.id !== tripId))
    }

    return (
        <TripCtx.Provider
            value={{
                activeLoad,
                tripStep,
                activeTrips,
                isLoading,
                error,
                acceptLoad,
                advanceTrip,
                resetTrip,
                acceptLoadOwner,
                advanceTripOwner,
                resetTripOwner,
                trackingState,
                startTracking,
                stopTracking,
                updateDriverPosition,
            }}
        >
            {children}
        </TripCtx.Provider>
    )
}

export function useTrip(): TripState {
    const ctx = useContext(TripCtx)
    if (!ctx) throw new Error('useTrip must be used within TripProvider')
    return ctx
}