import type {
    IEarningsService,
    GetPayoutsResponse,
    GetWeekEarningsResponse,
    GetWalletBalanceResponse,
    WithdrawRequest,
    WithdrawResponse,
} from '../types'
import { apiClient } from '../apiClient'

export const earningsService: IEarningsService = {
    async getPayouts(): Promise<GetPayoutsResponse> {
        const res = await apiClient.get<GetPayoutsResponse>('/earnings/payouts')
        return res.data
    },

    async getWeekEarnings(): Promise<GetWeekEarningsResponse> {
        const res = await apiClient.get<GetWeekEarningsResponse>('/earnings/weekly')
        return res.data
    },

    async getWalletBalance(): Promise<GetWalletBalanceResponse> {
        const res = await apiClient.get<GetWalletBalanceResponse>('/earnings/wallet')
        return res.data
    },

    async withdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
        const res = await apiClient.post<WithdrawResponse>('/earnings/withdraw', request)
        return res.data
    },
}