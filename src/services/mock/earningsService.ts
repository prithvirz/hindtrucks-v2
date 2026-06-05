import type {
    IEarningsService,
    GetPayoutsResponse,
    GetWeekEarningsResponse,
    GetWalletBalanceResponse,
    WithdrawRequest,
    WithdrawResponse,
} from '../types'
import { MOCK_PAYOUTS, WEEK_EARNINGS, DRIVER, type Payout } from '../../data/mockLoads'

const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

// Module-level mutable state
let mockWalletBalance = DRIVER.walletBalance
let mockPayouts = [...MOCK_PAYOUTS]

export const mockEarningsService: IEarningsService = {
    async getPayouts(): Promise<GetPayoutsResponse> {
        await delay()
        return { payouts: mockPayouts }
    },

    async getWeekEarnings(): Promise<GetWeekEarningsResponse> {
        await delay()
        return { earnings: [...WEEK_EARNINGS] }
    },

    async getWalletBalance(): Promise<GetWalletBalanceResponse> {
        await delay()
        return { balance: mockWalletBalance }
    },

    async withdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
        await delay()
        const newBalance = Math.max(0, mockWalletBalance - request.amount)
        mockWalletBalance = newBalance

        const transaction = {
            id: `P${Math.floor(9000 + Math.random() * 1000)}`,
            load: 'L1000',
            route: `Withdrawal to ${request.upiId}`,
            amount: request.amount,
            status: 'credited' as const,
            date: new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            }),
        }

        mockPayouts = [transaction, ...mockPayouts]

        return {
            success: true,
            newBalance,
            transaction,
        }
    },
}

// Helpers for resetting state
export function resetMockEarnings(): void {
    mockWalletBalance = DRIVER.walletBalance
    mockPayouts = [...MOCK_PAYOUTS]
}

export function setMockWalletBalance(amount: number) {
    mockWalletBalance = amount
}

export function clearMockPayouts() {
    mockPayouts = []
}

export function addMockPayout(payout: Payout) {
    mockPayouts = [payout, ...mockPayouts]
}

export function completeTripPayout(loadId: string, route: string, amount: number) {
    const hasBonus = mockPayouts.some(p => p.load === 'BONUS')
    const alreadyAdjusted = mockPayouts.some(p => p.load === 'BONUS_ADJUST')
    const isSignupBonusActive = hasBonus && !alreadyAdjusted

    if (isSignupBonusActive) {
        // Add trip earnings
        const tripPayout = {
            id: `P${Math.floor(9000 + Math.random() * 1000)}`,
            load: loadId,
            route: `Trip Earnings: ${route}`,
            amount: amount,
            status: 'credited' as const,
            date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        }

        // Add bonus deduction
        const bonusDeduction = {
            id: `P${Math.floor(9000 + Math.random() * 1000)}`,
            load: 'BONUS_ADJUST',
            route: `Signup Bonus Adjusted (Deducted)`,
            amount: -1500,
            status: 'credited' as const,
            date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        }

        mockPayouts = [tripPayout, bonusDeduction, ...mockPayouts]
        mockWalletBalance = mockWalletBalance + amount - 1500
    } else {
        const tripPayout = {
            id: `P${Math.floor(9000 + Math.random() * 1000)}`,
            load: loadId,
            route: `Trip Earnings: ${route}`,
            amount: amount,
            status: 'credited' as const,
            date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        }
        mockPayouts = [tripPayout, ...mockPayouts]
        mockWalletBalance += amount
    }
}