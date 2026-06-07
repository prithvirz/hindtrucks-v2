import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DRIVER, MOCK_PAYOUTS, type Payout } from '../data/mockLoads'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'

interface EarningsState {
    walletBalance: number
    payouts: Payout[]
    isLoading: boolean
    error: ApiError | null
    withdrawWallet: (amount: number, upiId: string) => Promise<boolean>
    refreshEarnings: () => Promise<void>
}

const EarningsCtx = createContext<EarningsState | null>(null)

export function EarningsProvider({ children }: { children: ReactNode }) {
    const { isLoggedIn } = useAuth()
    const [walletBalance, setWalletBalance] = useState(DRIVER.walletBalance)
    const [payouts, setPayouts] = useState<Payout[]>(MOCK_PAYOUTS)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    // Load earnings data from service on login
    useEffect(() => {
        if (isLoggedIn) {
            setIsLoading(true)
            await_import().then(({ earningsService }) => {
                Promise.all([
                    earningsService.getWalletBalance(),
                    earningsService.getPayouts(),
                    earningsService.getWeekEarnings(),
                ])
                    .then(([wallet, payoutsRes]) => {
                        setWalletBalance(wallet.balance)
                        setPayouts(payoutsRes.payouts)
                    })
                    .catch((err) => {
                        if (err instanceof ApiError) setError(err)
                    })
                    .finally(() => setIsLoading(false))
            })
        }
    }, [isLoggedIn])

    // Self-cleanup on logout
    useEffect(() => {
        if (!isLoggedIn) {
            setWalletBalance(DRIVER.walletBalance)
            setPayouts(MOCK_PAYOUTS)
            setError(null)
        }
    }, [isLoggedIn])

    const refreshEarnings = async () => {
        setError(null)
        setIsLoading(true)
        try {
            const { earningsService } = await import('../services/index')
            const [wallet, payoutsRes] = await Promise.all([
                earningsService.getWalletBalance(),
                earningsService.getPayouts()
            ])
            setWalletBalance(wallet.balance)
            setPayouts(payoutsRes.payouts)
        } catch (err) {
            if (err instanceof ApiError) setError(err)
        } finally {
            setIsLoading(false)
        }
    }

    const withdrawWallet = async (amount: number, upiId: string): Promise<boolean> => {
        setError(null)
        setIsLoading(true)

        try {
            const { earningsService } = await import('../services/index')
            const result = await earningsService.withdraw({ amount, upiId })
            setWalletBalance(result.newBalance)
            setPayouts((prev) => [result.transaction, ...prev])
            return true
        } catch (err) {
            // Surface the failure and leave the wallet untouched. Optimistically
            // debiting here would show money leaving on a rejected withdrawal
            // (e.g. insufficient balance / not authenticated).
            setError(
                err instanceof ApiError
                    ? err
                    : new ApiError((err as Error)?.message || 'Withdrawal failed', 0, 'WITHDRAW_FAILED'),
            )
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <EarningsCtx.Provider value={{ walletBalance, payouts, isLoading, error, withdrawWallet, refreshEarnings }}>
            {children}
        </EarningsCtx.Provider>
    )
}

export function useEarnings(): EarningsState {
    const ctx = useContext(EarningsCtx)
    if (!ctx) throw new Error('useEarnings must be used within EarningsProvider')
    return ctx
}

// Helper for dynamic import
function await_import() {
    return import('../services/index')
}