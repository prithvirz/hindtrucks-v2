import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../services/errors'
import {
    deleteStoredNotification,
    getStoredNotifications,
} from '../features/notifications/services/notificationService'
import { clearChatHistory } from '../features/chatbot/services/chatService'
import { messaging } from '../lib/firebase'

interface AuthState {
    isLoggedIn: boolean
    phone: string
    registrationStatus: 'unknown' | 'registered' | 'unregistered'
    authIntent: 'login' | 'register' | null
    isLoading: boolean
    error: ApiError | null
    sendOtp: (phone: string, intent?: 'login' | 'register') => Promise<void>
    login: (phone: string) => void
    verifyOtp: (phone: string, otp: string) => Promise<{ registered: boolean }>
    markRegistered: (registeredPhone?: string) => void
    logout: () => void
}

const AuthCtx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setLoggedIn] = useState<boolean>(
        () => localStorage.getItem('ht_auth') === '1',
    )
    const [phone, setPhone] = useState<string>(
        () => localStorage.getItem('ht_phone') || '',
    )
    const [registrationStatus, setRegistrationStatus] = useState<'unknown' | 'registered' | 'unregistered'>(
        () => {
            const storedPhone = localStorage.getItem('ht_phone') || ''
            if (storedPhone && localStorage.getItem('ht_registered_' + storedPhone) === '1') return 'registered'
            if (storedPhone) return 'unregistered'
            return 'unknown'
        },
    )
    const [authIntent, setAuthIntent] = useState<'login' | 'register' | null>(null)
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
                        setRegistrationStatus('unknown')
                        localStorage.removeItem('ht_auth_token')
                        localStorage.removeItem('ht_phone')
                    } else if (session.phone) {
                        setPhone(session.phone)
                        import('../services/index')
                            .then(({ profileService }) => profileService.getRegistrationStatus())
                            .then(({ registered }) => setRegistrationStatus(registered ? 'registered' : 'unregistered'))
                            .catch(() => setRegistrationStatus('unknown'))
                    }
                })
                .catch(() => {
                    // Session check failed — stay logged in with local state
                })
        }
    }, [])

    const sendOtp = async (p: string, intent?: 'login' | 'register'): Promise<void> => {
        setError(null)
        setIsLoading(true)
        if (intent) setAuthIntent(intent)
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
        setRegistrationStatus(localStorage.getItem('ht_registered_' + p) === '1' ? 'registered' : 'unregistered')
    }

    const verifyOtp = async (p: string, otp: string): Promise<{ registered: boolean }> => {
        setError(null)
        setIsLoading(true)
        try {
            const { authService, profileService } = await import('../services/index')
            const result = await authService.verifyOtp({ phone: p, otp })
            if (result.success) {
                localStorage.setItem('ht_auth_token', result.tokens.access.token)
                localStorage.setItem('ht_phone', p)
                setPhone(p)
                setLoggedIn(true)
                const { registered } = await profileService.getRegistrationStatus()
                setRegistrationStatus(registered ? 'registered' : 'unregistered')
                return { registered }
            }
            return { registered: false }
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

    const markRegistered = (registeredPhone?: string) => {
        setRegistrationStatus('registered')
        const targetPhone = registeredPhone || phone
        if (targetPhone) localStorage.setItem('ht_registered_' + targetPhone, '1')
    }

    const logout = () => {
        import('../services/index').then(({ authService }) => {
            authService.logout().catch(() => { /* silent */ })
        })
        // Delete FCM token on logout
        import('firebase/messaging').then(({ deleteToken }) => {
            deleteToken(messaging).catch(() => { /* silent */ })
        }).catch(() => { /* silent */ })
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
        setRegistrationStatus('unknown')
        setAuthIntent(null)
        setError(null)
        localStorage.removeItem('ht_auth_token')
        localStorage.removeItem('ht_phone')
    }

    return (
        <AuthCtx.Provider value={{ isLoggedIn, phone, registrationStatus, authIntent, isLoading, error, sendOtp, login, verifyOtp, markRegistered, logout }}>
            {children}
        </AuthCtx.Provider>
    )
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthCtx)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
