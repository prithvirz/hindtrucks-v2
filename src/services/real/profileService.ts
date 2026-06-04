import type {
    IProfileService,
    GetProfileResponse,
    SetOnlineStatusRequest,
    SetOnlineStatusResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const profileService: IProfileService = {
    async getProfile(): Promise<GetProfileResponse> {
        const res = await apiClient.get<GetProfileResponse>('/profile')
        return res.data
    },

    async setOnlineStatus(request: SetOnlineStatusRequest): Promise<SetOnlineStatusResponse> {
        const res = await apiClient.post<SetOnlineStatusResponse>('/profile/online', request)
        return res.data
    },
}