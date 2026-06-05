import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DRIVER, MOCK_PAYOUTS, type Payout } from '../data/mockLoads'
import { useAuth } from './AuthContext'
import { ApiError } from '../services/errors'

interface EarningsState {
    walletBalance: number
    payouts: Payout[]
    isLoading: boolean
    error: ApiError | null
    withdrawWallet: (amount: number, upiId: string) => void
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

    const withdrawWallet = async (amount: number, upiId: string) => {
        setError(null)
        setIsLoading(true)

        try {
            const { earningsService } = await import('../services/index')
            const result = await earningsService.withdraw({ amount, upiId })
            setWalletBalance(result.newBalance)
            setPayouts((prev) => [result.transaction, ...prev])
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err)
            }
            // Fallback to local state update even on error
            setWalletBalance((prev) => Math.max(0, prev - amount))
            setPayouts((prev) => [
                {
                    id: `P${Math.floor(9000 + Math.random() * 1000)}`,
                    load: 'L1000',
                    route: `Withdrawal to ${upiId}`,
                    amount,
                    status: 'credited',
                    date: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                },
                ...prev,
            ])
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