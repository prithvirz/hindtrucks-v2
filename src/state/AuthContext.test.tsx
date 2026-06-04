import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

describe('useAuth', () => {
    it('returns initial unauthenticated state', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        })
        expect(result.current.isLoggedIn).toBe(false)
        expect(result.current.phone).toBe('')
    })

    it('provides login function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        })
        expect(typeof result.current.login).toBe('function')
    })

    it('provides verifyOtp function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        })
        expect(typeof result.current.verifyOtp).toBe('function')
    })

    it('provides logout function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        })
        expect(typeof result.current.logout).toBe('function')
    })

    it('throws when used outside provider', () => {
        expect(() => renderHook(() => useAuth())).toThrow()
    })
})