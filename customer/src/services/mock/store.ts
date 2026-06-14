import type { Booking } from '../types'
import { goodsImage } from '../../lib/assets'

const KEY = 'htc_bookings'
const HOUR = 60 * 60 * 1000

// Seeded relative to "now" so the in-transit booking actually animates.
function seed(): Booking[] {
  const now = Date.now()
  return [
    {
      id: 'B1042',
      fromCity: 'Delhi', fromArea: 'Okhla Industrial Area',
      toCity: 'Jaipur', toArea: 'Sitapura',
      goods: 'electronics', weightTon: 9, distanceKm: 281,
      price: 18500, advance: 6000, truckType: '19 ft · 9 Ton',
      shipperName: 'You', shipperVerified: true, shipperUid: 'me',
      image: goodsImage.electronics,
      status: 'in_transit', createdAt: now - 3 * HOUR,
      driver: { name: 'Rajbir Singh', phone: '+91 98765 43210', truckReg: 'PB10 AB 4521', rating: 4.8 },
    },
    {
      id: 'B1043',
      fromCity: 'Mumbai', fromArea: 'Bhiwandi',
      toCity: 'Pune', toArea: 'Chakan MIDC',
      goods: 'furniture', weightTon: 6, distanceKm: 148,
      price: 9200, advance: 3000, truckType: '17 ft · 6 Ton',
      shipperName: 'You', shipperVerified: true, shipperUid: 'me',
      image: goodsImage.furniture,
      status: 'accepted', createdAt: now - 40 * 60 * 1000,
      driver: { name: 'Imran Khan', phone: '+91 90123 45678', truckReg: 'MH04 CD 1190', rating: 4.6 },
    },
    {
      id: 'B1044',
      fromCity: 'Chennai', fromArea: 'Ennore Port',
      toCity: 'Bengaluru', toArea: 'Hosur Road',
      goods: 'containers', weightTon: 21, distanceKm: 347,
      price: 27400, advance: 9000, truckType: '32 ft · 21 Ton',
      shipperName: 'You', shipperVerified: true, shipperUid: 'me',
      image: goodsImage.containers,
      status: 'available', createdAt: now - 15 * 60 * 1000,
      driver: null,
    },
    {
      id: 'B1031',
      fromCity: 'Ludhiana', fromArea: 'Focal Point',
      toCity: 'Delhi', toArea: 'Narela',
      goods: 'parcels', weightTon: 4, distanceKm: 312,
      price: 12800, advance: 4000, truckType: '14 ft · 4 Ton',
      shipperName: 'You', shipperVerified: true, shipperUid: 'me',
      image: goodsImage.parcels,
      status: 'completed', createdAt: now - 30 * HOUR,
      driver: { name: 'Sukhdev Yadav', phone: '+91 99887 76655', truckReg: 'PB08 EF 7732', rating: 4.9 },
    },
  ]
}

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Booking[]
  } catch {
    // ignore corrupt storage
  }
  const seeded = seed()
  saveBookings(seeded)
  return seeded
}

export function saveBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(bookings))
  } catch {
    // ignore quota / private-mode errors
  }
}
