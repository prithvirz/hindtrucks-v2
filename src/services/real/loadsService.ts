import type {
    ILoadsService,
    GetLoadsRequest,
    GetLoadsResponse,
    GetLoadDetailRequest,
    GetLoadDetailResponse,
    AcceptLoadRequest,
    AcceptLoadResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const loadsService: ILoadsService = {
    async getLoads(request?: GetLoadsRequest): Promise<GetLoadsResponse> {
        const res = await apiClient.get<GetLoadsResponse>('/loads', request as Record<string, string | number | boolean | undefined>)
        return res.data
    },

    async getLoadDetail(request: GetLoadDetailRequest): Promise<GetLoadDetailResponse> {
        const res = await apiClient.get<GetLoadDetailResponse>(`/loads/${request.loadId}`)
        return res.data
    },

    async acceptLoad(request: AcceptLoadRequest): Promise<AcceptLoadResponse> {
        const res = await apiClient.post<AcceptLoadResponse>('/loads/accept', { loadId: request.loadId })
        return res.data
    },
}