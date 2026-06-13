import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

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
    setPhone(localStorage.getItem('htc_phone'))
    setReady(true)
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
        localStorage.removeItem('htc_phone')
        localStorage.removeItem('htc_bookings')
        localStorage.removeItem('htc_profile')
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
