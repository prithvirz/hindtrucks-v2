import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services'

interface AuthValue {
  isLoggedIn: boolean
  phone: string | null
  ready: boolean
  /** Mark the user as logged in after OTP verification. */
  login: (phone: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    authService
      .checkSession()
      .then((session) => {
        if (!active) return
        setPhone(session.valid ? session.phone ?? null : null)
      })
      .catch(() => {
        if (active) setPhone(null)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      isLoggedIn: Boolean(phone),
      phone,
      ready,
      login: (p: string) => {
        localStorage.setItem('htc_phone', p)
        localStorage.setItem(`htc_registered_${p}`, 'true')
        setPhone(p)
      },
      logout: () => {
        authService.logout().catch(() => { /* silent */ })
        localStorage.removeItem('htc_phone')
        localStorage.removeItem('htc_bookings')
        localStorage.removeItem('htc_profile')
        localStorage.removeItem('htc_firebase_uid')
        setPhone(null)
      },
    }),
    [phone, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
