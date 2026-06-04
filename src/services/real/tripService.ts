import type {
    ITripService,
    AdvanceStepRequest,
    AdvanceStepResponse,
    CompleteTripRequest,
    CompleteTripResponse,
    GetActiveTripResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const tripService: ITripService = {
    async getActiveTrip(): Promise<GetActiveTripResponse> {
        const res = await apiClient.get<GetActiveTripResponse>('/trips/active')
        return res.data
    },

    async advanceStep(request: AdvanceStepRequest): Promise<AdvanceStepResponse> {
        const res = await apiClient.post<AdvanceStepResponse>('/trips/advance', request)
        return res.data
    },

    async completeTrip(request: CompleteTripRequest): Promise<CompleteTripResponse> {
        const res = await apiClient.post<CompleteTripResponse>('/trips/complete', request)
        return res.data
    },
}