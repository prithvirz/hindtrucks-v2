// Real Firebase-backed services. Stubbed until the customer app is wired to the
// shared 'hindtruck' Firebase project (see docs). Mock mode is the default.
import type { IAuthService, IBookingService, ITrackingService, IProfileService } from '../types'

const NOT_WIRED = 'Real (Firebase) services are not wired yet — run in mock mode (VITE_API_MODE=mock).'
function notWired(): never {
  throw new Error(NOT_WIRED)
}

export const realAuthService: IAuthService = {
  sendOtp: notWired,
  verifyOtp: notWired,
  logout: notWired,
  checkSession: notWired,
}

export const realBookingService: IBookingService = {
  createBooking: notWired,
  getMyBookings: notWired,
  getBooking: notWired,
  cancelBooking: notWired,
}

export const realTrackingService: ITrackingService = {
  getTripStatus: notWired,
  subscribeTripStatus: notWired,
}

export const realProfileService: IProfileService = {
  getProfile: notWired,
  saveProfile: notWired,
}
