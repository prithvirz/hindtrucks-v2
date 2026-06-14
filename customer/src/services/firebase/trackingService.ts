import type { ITrackingService, TripStatus } from '../types'
import type { TripStep, TruckPosition, DriverInfo } from '@hindtrucks/shared'
import { db, loadDoc } from '@hindtrucks/shared/firebase'
import { getDoc } from 'firebase/firestore'

const TRIP_DURATION = 6 * 60 * 60 * 1000

export const firebaseTrackingService: ITrackingService = {
    async getTripStatus(loadId: string): Promise<TripStatus> {
        const docSnap = await getDoc(loadDoc(db, loadId))
        if (!docSnap.exists()) throw new Error('Booking not found')

        const data = docSnap.data()
        const step: TripStep = (data.step as TripStep) ?? 0
        const position: TruckPosition | null = data.position ?? null
        const driver: DriverInfo | null = data.driver ?? null
        const status: string = data.status

        let progress = 0

        if (status === 'accepted') {
            progress = 0
        } else if (status === 'in_transit') {
            const createdAtMs = data.createdAt?.toMillis?.() ?? Date.now()
            const elapsed = Date.now() - createdAtMs
            progress = Math.min(0.95, Math.max(0.05, elapsed / TRIP_DURATION))
        } else if (status === 'completed') {
            progress = 1
        }

        return { loadId, step, position, driver, progress }
    },
}