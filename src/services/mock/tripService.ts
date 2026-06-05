import type {
    ITripService,
    AdvanceStepRequest,
    AdvanceStepResponse,
    CompleteTripRequest,
    CompleteTripResponse,
    GetActiveTripResponse,
} from '../types'
import type { TripStep } from '../../state/types'
import type { Load } from '../../data/mockLoads'
import { completeTripPayout } from './earningsService'
import { completeTripStats } from './profileService'

const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

// Module-level state for mock active trip
let mockActiveLoad: Load | null = null
let mockTripStep: TripStep = 0

export const mockTripService: ITripService = {
    async getActiveTrip(): Promise<GetActiveTripResponse> {
        await delay()
        return {
            activeLoad: mockActiveLoad,
            tripStep: mockTripStep,
        }
    },

    async advanceStep(request: AdvanceStepRequest): Promise<AdvanceStepResponse> {
        await delay()
        const currentStep = request.currentStep
        const newStep = currentStep < 4 ? ((currentStep + 1) as TripStep) : currentStep
        mockTripStep = newStep

        if (newStep === 4 && mockActiveLoad) {
            completeTripPayout(
                mockActiveLoad.id,
                `${mockActiveLoad.fromCity} → ${mockActiveLoad.toCity}`,
                mockActiveLoad.price
            )
            completeTripStats(mockActiveLoad.price)
        }

        const messages: Record<number, string> = {
            1: 'Arrived at pickup point',
            2: 'Goods loaded — en route to destination',
            3: 'Arrived at drop-off — unloading in progress',
            4: 'Trip completed',
        }

        return {
            newStep,
            message: messages[newStep],
        }
    },

    async completeTrip(_request: CompleteTripRequest): Promise<CompleteTripResponse> {
        await delay()
        mockTripStep = 4
        mockActiveLoad = null

        return {
            success: true,
            payoutAmount: 18500,
            payoutId: `P${Math.floor(9000 + Math.random() * 1000)}`,
        }
    },
}

// Helper to set mock active load (used by TripContext integration)
export function setMockActiveLoad(load: Load | null): void {
    mockActiveLoad = load
}

export function setMockTripStep(step: TripStep): void {
    mockTripStep = step
}