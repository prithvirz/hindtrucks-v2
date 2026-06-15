import type { Load, GoodsKey, LoadStatus, TripStep, TruckPosition, DriverInfo } from '@hindtrucks/shared'

export type { Load, GoodsKey, LoadStatus, TripStep, TruckPosition, DriverInfo }

// ── Auth ──

export interface SendOtpRequest {
  phone: string
}
export interface SendOtpResponse {
  success: boolean
  retryAfterSeconds: number
}
export interface VerifyOtpRequest {
  phone: string
  otp: string
}
export interface VerifyOtpResponse {
  success: boolean
  isNewUser: boolean
}
export interface SessionCheckResponse {
  valid: boolean
  phone?: string
}

export interface IAuthService {
  sendOtp(req: SendOtpRequest): Promise<SendOtpResponse>
  verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse>
  logout(): Promise<void>
  checkSession(): Promise<SessionCheckResponse>
}

// ── Bookings ──

/** A load the shipper has posted, plus its marketplace status + driver. */
export interface Booking extends Load {
  status: LoadStatus
  createdAt: number
  driver?: DriverInfo | null
}

export interface NewBookingRequest {
  fromCity: string
  fromArea: string
  toCity: string
  toArea: string
  goods: GoodsKey
  weightTon: number
  truckType: string
  distanceKm: number
  price: number
  advance: number
}

export interface IBookingService {
  createBooking(req: NewBookingRequest): Promise<Booking>
  getMyBookings(): Promise<Booking[]>
  getBooking(id: string): Promise<Booking>
  cancelBooking(id: string): Promise<void>
}

// ── Tracking ──

export interface TripStatus {
  loadId: string
  step: TripStep
  position: TruckPosition | null
  driver: DriverInfo | null
  /** 0..1 progress along the route, for the mock map. */
  progress: number
}

export type TripStatusCallback = (status: TripStatus) => void

export interface ITrackingService {
  getTripStatus(loadId: string): Promise<TripStatus>
  /**
   * Subscribe to live trip updates for a load. Fires once with the current
   * status, then again on every change. Returns an unsubscribe function.
   */
  subscribeTripStatus(loadId: string, onUpdate: TripStatusCallback): () => void
}

// ── Profile ──

export interface ShipperProfile {
  name: string
  phone: string
  company?: string
}

export interface IProfileService {
  getProfile(): Promise<ShipperProfile>
  saveProfile(profile: ShipperProfile): Promise<ShipperProfile>
}
