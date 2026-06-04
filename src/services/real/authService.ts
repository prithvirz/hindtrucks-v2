import type {
    IAuthService,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    LogoutRequest,
    SessionCheckResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const authService: IAuthService = {
    async sendOtp(request: SendOtpRequest): Promise<SendOtpResponse> {
        const res = await apiClient.post<SendOtpResponse>('/auth/send-otp', request)
        return res.data
    },

    async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        const res = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', request)
        return res.data
    },

    async logout(request?: LogoutRequest): Promise<void> {
        await apiClient.post<void>('/auth/logout', request)
    },

    async checkSession(): Promise<SessionCheckResponse> {
        const res = await apiClient.get<SessionCheckResponse>('/auth/session')
        return res.data
    },
}