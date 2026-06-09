import type {
    IProfileService,
    CreateDriverProfileRequest,
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
const mockProfiles = new Map<string, GetProfileResponse['profile']>()

function normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, '')
    return digits.length > 10 ? digits.slice(-10) : digits
}

function currentPhone(): string {
    return normalizePhone(localStorage.getItem('ht_phone') || DRIVER.phone)
}

function defaultProfile(phone = currentPhone()): GetProfileResponse['profile'] {
    return {
        name: DRIVER.name,
        phone,
        rating: DRIVER.rating,
        tripsToday: mockTripsToday,
        earningsToday: mockEarningsToday,
        truck: {
            regNumber: DRIVER.truck.regNumber,
            type: DRIVER.truck.type,
            capacity: DRIVER.truck.capacity,
        },
    }
}

export const mockProfileService: IProfileService = {
    async getProfile(): Promise<GetProfileResponse> {
        await delay()
        const phone = currentPhone()
        return { profile: mockProfiles.get(phone) ?? defaultProfile(phone) }
    },

    async getRegistrationStatus() {
        await delay()
        return { registered: mockProfiles.has(currentPhone()) || localStorage.getItem(`ht_registered_${currentPhone()}`) === '1' }
    },

    async createDriverProfile({ name, phone }: CreateDriverProfileRequest): Promise<GetProfileResponse> {
        await delay()
        const normalizedPhone = normalizePhone(phone)
        const profile = {
            name,
            phone: normalizedPhone,
            rating: 5.0,
            tripsToday: 0,
            earningsToday: 0,
            truck: {
                regNumber: '',
                type: '',
                capacity: '',
            },
            phoneVerified: true,
            verificationMethod: 'phone_otp',
        }
        mockProfiles.set(normalizedPhone, profile)
        return { profile }
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
    mockProfiles.clear()
}
