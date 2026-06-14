import type { IBookingService, Booking, NewBookingRequest } from '../types'
import { goodsImage } from '../../lib/assets'
import { loadBookings, saveBookings } from './store'

const delay = () => new Promise<void>((r) => setTimeout(r, 250 + Math.random() * 400))

export const mockBookingService: IBookingService = {
  async createBooking(req: NewBookingRequest): Promise<Booking> {
    await delay()
    const now = Date.now()
    const booking: Booking = {
      id: 'B' + now.toString().slice(-6),
      fromCity: req.fromCity,
      fromArea: req.fromArea,
      toCity: req.toCity,
      toArea: req.toArea,
      goods: req.goods,
      weightTon: req.weightTon,
      distanceKm: req.distanceKm,
      price: req.price,
      advance: req.advance,
      truckType: req.truckType,
      shipperName: 'You',
      shipperVerified: true,
      shipperUid: 'me',
      image: goodsImage[req.goods] ?? goodsImage.default,
      status: 'available',
      createdAt: now,
      driver: null,
    }
    const all = loadBookings()
    all.unshift(booking)
    saveBookings(all)
    return booking
  },

  async getMyBookings(): Promise<Booking[]> {
    await delay()
    return loadBookings().sort((a, b) => b.createdAt - a.createdAt)
  },

  async getBooking(id: string): Promise<Booking> {
    await delay()
    const found = loadBookings().find((b) => b.id === id)
    if (!found) throw new Error('Booking not found')
    return found
  },

  async cancelBooking(id: string): Promise<void> {
    await delay()
    const all = loadBookings()
    const idx = all.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error('Booking not found')
    if (all[idx].status !== 'available') throw new Error('Only pending bookings can be cancelled')
    all[idx] = { ...all[idx], status: 'cancelled' }
    saveBookings(all)
  },
}
