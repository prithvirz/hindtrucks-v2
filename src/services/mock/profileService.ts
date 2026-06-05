import type {
    IProfileService,
    GetProfileResponse,
    SetOnlineStatusRequest,
    SetOnlineStatusResponse,
} from '../types'
import { DRIVER } from '../../data/mockLoads'

const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

// Module-level mutable state
let mockIsOnline = false
let mockTripsToday = DRIVER.tripsToday
let mockEarningsToday = DRIVER.earningsToday

export const mockProfileService: IProfileService = {
    async getProfile(): Promise<GetProfileResponse> {
        await delay()
        return {
            profile: {
                name: DRIVER.name,
                phone: DRIVER.phone,
                rating: DRIVER.rating,
                tripsToday: mockTripsToday,
                earningsToday: mockEarningsToday,
                truck: {
                    regNumber: DRIVER.truck.regNumber,
                    type: DRIVER.truck.type,
                    capacity: DRIVER.truck.capacity,
                },
            },
        }
    },

    async setOnlineStatus(request: SetOnlineStatusRequest): Promise<SetOnlineStatusResponse> {
        await delay()
        mockIsOnline = request.isOnline
        return { isOnline: mockIsOnline }
    },
}

// Helpers
export function getMockOnlineStatus(): boolean {
    return mockIsOnline
}

export function completeTripStats(amount: number): void {
    mockTripsToday += 1
    mockEarningsToday += amount
}

export function resetMockProfile(): void {
    mockIsOnline = false
    mockTripsToday = DRIVER.tripsToday
    mockEarningsToday = DRIVER.earningsToday
}