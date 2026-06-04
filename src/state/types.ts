import { type Load } from '../data/mockLoads'

export type TripStep = 0 | 1 | 2 | 3 | 4 // 0 = none, 1..4 = stepper stages

export interface NotificationPayload {
    title: string
    message: string
    type: 'sms' | 'push'
}

export interface DriverProfile {
    name: string
    phone: string
    rating: number
    tripsToday: number
    earningsToday: number
    truck: {
        regNumber: string
        type: string
        capacity: string
    }
}

export type UserRole = 'driver' | 'owner'

export interface Driver {
    id: string
    name: string
    phone: string
    licenseNumber: string
    assignedTruckId: string | null
}

export interface ActiveTrip {
    id: string
    load: Load
    truckId: string
    driverId: string
    step: TripStep
}