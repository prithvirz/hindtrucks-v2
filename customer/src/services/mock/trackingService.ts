import type { ITrackingService, TripStatus, TripStep, TripStatusCallback } from '../types'
import { loadBookings } from './store'
import { lookupCity } from '../../data/cityCoords'

// A booking is assumed to take ~6h end-to-end for the mock animation.
const TRIP_DURATION = 6 * 60 * 60 * 1000

function bearing(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const [lat1, lon1] = a.map(toRad) as [number, number]
  const [lat2, lon2] = b.map(toRad) as [number, number]
  const dLon = lon2 - lon1
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export const mockTrackingService: ITrackingService = {
  async getTripStatus(loadId: string): Promise<TripStatus> {
    const booking = loadBookings().find((b) => b.id === loadId)
    if (!booking) throw new Error('Booking not found')

    const from = lookupCity(booking.fromCity)
    const to = lookupCity(booking.toCity)

    // Derive progress from elapsed time for an in-transit booking.
    let progress = 0
    let step: TripStep = 0
    if (booking.status === 'accepted') {
      progress = 0
      step = 1
    } else if (booking.status === 'in_transit') {
      const elapsed = Date.now() - booking.createdAt
      progress = Math.min(0.95, Math.max(0.05, elapsed / TRIP_DURATION))
      step = progress > 0.5 ? 3 : 2
    } else if (booking.status === 'completed') {
      progress = 1
      step = 4
    }

    let position = null
    if (from && to && (booking.status === 'in_transit' || booking.status === 'completed')) {
      const lat = from[0] + (to[0] - from[0]) * progress
      const lng = from[1] + (to[1] - from[1]) * progress
      position = {
        lat,
        lng,
        heading: bearing(from, to),
        speed: booking.status === 'in_transit' ? 52 : 0,
        recordedAt: Date.now(),
      }
    }

    return { loadId, step, position, driver: booking.driver ?? null, progress }
  },

  // Mock has no real-time source, so emulate live updates by polling the
  // derived status. Fires immediately, then every 4s until unsubscribed.
  subscribeTripStatus(loadId: string, onUpdate: TripStatusCallback): () => void {
    const tick = () => {
      this.getTripStatus(loadId).then(onUpdate).catch(() => {})
    }
    tick()
    const timer = setInterval(tick, 4000)
    return () => clearInterval(timer)
  },
}
