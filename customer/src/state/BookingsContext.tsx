import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { bookingService } from '../services'
import type { Booking, NewBookingRequest } from '../services'
import { useAuth } from './AuthContext'

interface BookingsValue {
  bookings: Booking[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createBooking: (req: NewBookingRequest) => Promise<Booking>
  cancelBooking: (id: string) => Promise<void>
}

const BookingsContext = createContext<BookingsValue | null>(null)

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBookings(await bookingService.getMyBookings())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) void refresh()
    else setBookings([])
  }, [isLoggedIn, refresh])

  const createBooking = useCallback(async (req: NewBookingRequest) => {
    const created = await bookingService.createBooking(req)
    setBookings((prev) => [created, ...prev])
    return created
  }, [])

  const cancelBooking = useCallback(async (id: string) => {
    await bookingService.cancelBooking(id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
  }, [])

  const value = useMemo<BookingsValue>(
    () => ({ bookings, loading, error, refresh, createBooking, cancelBooking }),
    [bookings, loading, error, refresh, createBooking, cancelBooking],
  )

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
}

export function useBookings(): BookingsValue {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
