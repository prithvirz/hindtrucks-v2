import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../services/errors'
import {
    unsubscribeFromPush,
    deleteStoredNotification,
    getStoredNotifications,
} from '../features/notifications/services/notificationService'
import { clearChatHistory } from '../features/chatbot/services/chatService'

interface AuthState {
    isLoggedIn: boolean
    phone: string
    isLoading: boolean
    error: ApiError | null
    sendOtp: (phone: string) => Promise<void>
    login: (phone: string) => void
    verifyOtp: (phone: string, otp: string) => Promise<void>
    logout: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setLoggedIn] = useState<boolean>(
        () => localStorage.getItem('ht_auth') === '1',
    )
    const [phone, setPhone] = useState<string>(
        () => localStorage.getItem('ht_phone') || (localStorage.getItem('ht_auth') === '1' ? '9876543210' : ''),
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
                        setPhone(session.phone)
                    }
                })
                .catch(() => {
                    // Session check failed — stay logged in with local state
                })
        }
    }, [])

    const sendOtp = async (p: string): Promise<void> => {
        setError(null)
        setIsLoading(true)
        try {
            const { authService } = await import('../services/index')
            await authService.sendOtp({ phone: p })
        } catch (err) {
            setError(err instanceof ApiError ? err : new ApiError(
                err instanceof Error ? err.message : 'Failed to send OTP',
                0,
                'UNKNOWN_ERROR',
            ))
            throw err
        } finally {
            setIsLoading(false)
        }
    }

    const login = (p: string) => {
        setError(null)
        setPhone(p)
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
                setPhone(p)
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
        const clearStoredNotifications = async () => {
            const stored = await getStoredNotifications()
            await Promise.all(stored.map((n) => deleteStoredNotification(n.id)))
        }
        clearStoredNotifications().catch(() => { /* silent */ })
        // Clear chat history from IndexedDB on logout
        clearChatHistory().catch(() => { /* silent */ })
        setLoggedIn(false)
        setPhone('')
        setError(null)
        localStorage.removeItem('ht_auth_token')
        localStorage.removeItem('ht_phone')
    }

    return (
        <AuthCtx.Provider value={{ isLoggedIn, phone, isLoading, error, sendOtp, login, verifyOtp, logout }}>
            {children}
        </AuthCtx.Provider>
    )
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}