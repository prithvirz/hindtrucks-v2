import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../services/errors'
import { unsubscribeFromPush, deleteStoredNotification, getStoredNotifications } from '../features/notifications/services/notificationService'
import { clearChatHistory } from '../features/chatbot/services/chatService'

interface AuthState {
    isLoggedIn: boolean
    phone: string
    isLoading: boolean
    error: ApiError | null
    login: (phone: string) => void
    verifyOtp: (phone: string, otp: string) => Promise<void>
    logout: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

// Phone identity must be a consistent format across the app — login stores bare
// 10 digits, but checkSession/profile may return a "+91 98765 43210" form.
// Normalize to bare 10 digits so the registration guard and profile keys match
// regardless of source.
const normalizePhone = (p: string | null | undefined) => (p || '').replace(/\D/g, '').slice(-10)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setLoggedIn] = useState<boolean>(
        () => localStorage.getItem('ht_auth') === '1',
    )
    const [phone, setPhone] = useState<string>(
        () => normalizePhone(localStorage.getItem('ht_phone')) || (localStorage.getItem('ht_auth') === '1' ? '9876543210' : ''),
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<ApiError | null>(null)

    useEffect(() => {
        localStorage.setItem('ht_auth', isLoggedIn ? '1' : '0')
    }, [isLoggedIn])

    useEffect(() => {
        if (phone) {
            localStorage.setItem('ht_phone', phone)
        } else {
            localStorage.removeItem('ht_phone')
        }
    }, [phone])

    // Async session check on mount (if token exists) — service-backed but non-blocking
    useEffect(() => {
        const token = localStorage.getItem('ht_auth_token')
        if (token) {
            import('../services/index')
                .then(({ authService }) => authService.checkSession())
                .then((session) => {
                    if (!session.valid) {
                        setLoggedIn(false)
                        localStorage.removeItem('ht_auth_token')
                        localStorage.removeItem('ht_phone')
                    } else if (session.phone) {
                        setPhone(normalizePhone(session.phone))
                    }
                })
                .catch(() => {
                    // Session check failed — stay logged in with local state
                })
        }
    }, [])

    const login = (p: string) => {
        setError(null)
        setPhone(normalizePhone(p))
        setLoggedIn(true)
    }

    const verifyOtp = async (p: string, otp: string): Promise<void> => {
        setError(null)
        setIsLoading(true)
        try {
            const { authService } = await import('../services/index')
            const result = await authService.verifyOtp({ phone: p, otp })
            if (result.success) {
                localStorage.setItem('ht_auth_token', result.tokens.access.token)
                setPhone(normalizePhone(p))
                setLoggedIn(true)
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err)
            } else {
                setError(new ApiError(
                    err instanceof Error ? err.message : 'OTP verification failed',
                    0,
                    'UNKNOWN_ERROR',
                ))
            }
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        import('../services/index').then(({ authService }) => {
            authService.logout().catch(() => { /* silent */ })
        })
        // Unsubscribe push notifications on logout
        unsubscribeFromPush().catch(() => { /* silent */ })
        // Clear stored notifications from IndexedDB
        const clearNotifications = async () => {
            const stored = await getStoredNotifications()
            await Promise.all(stored.map((n) => deleteStoredNotification(n.id)))
        }
        clearNotifications().catch(() => { /* silent */ })
        // Clear chat history from IndexedDB on logout
        clearChatHistory().catch(() => { /* silent */ })
        setLoggedIn(false)
        setPhone('')
        setError(null)
        localStorage.removeItem('ht_auth_token')
        localStorage.removeItem('ht_phone')
    }

    return (
        <AuthCtx.Provider value={{ isLoggedIn, phone, isLoading, error, login, verifyOtp, logout }}>
            {children}
        </AuthCtx.Provider>
    )
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}