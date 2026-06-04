import { renderHook } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { EarningsProvider, useEarnings } from './EarningsContext'

describe('useEarnings', () => {
    it('returns walletBalance as a number initially', () => {
        const { result } = renderHook(() => useEarnings(), {
            wrapper: ({ children }) => (
                <AuthProvider><EarningsProvider>{children}</EarningsProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.walletBalance).toBe('number')
    })

    it('returns payouts array', () => {
        const { result } = renderHook(() => useEarnings(), {
            wrapper: ({ children }) => (
                <AuthProvider><EarningsProvider>{children}</EarningsProvider></AuthProvider>
            ),
        })
        expect(Array.isArray(result.current.payouts)).toBe(true)
    })

    it('provides withdrawWallet function', () => {
        const { result } = renderHook(() => useEarnings(), {
            wrapper: ({ children }) => (
                <AuthProvider><EarningsProvider>{children}</EarningsProvider></AuthProvider>
            ),
        })
        expect(typeof result.current.withdrawWallet).toBe('function')
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useEarnings())).toThrow()
    })
})