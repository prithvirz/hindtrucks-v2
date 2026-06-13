import type { IAuthService, IBookingService, ITrackingService, IProfileService } from './types'

import { mockAuthService } from './mock/authService'
import { mockBookingService } from './mock/bookingService'
import { mockTrackingService } from './mock/trackingService'
import { mockProfileService } from './mock/profileService'

import { realAuthService, realBookingService, realTrackingService, realProfileService } from './real'

const MODE = (import.meta.env.VITE_API_MODE as 'mock' | 'real') || 'mock'
const real = MODE === 'real'

export const authService: IAuthService = real ? realAuthService : mockAuthService
export const bookingService: IBookingService = real ? realBookingService : mockBookingService
export const trackingService: ITrackingService = real ? realTrackingService : mockTrackingService
export const profileService: IProfileService = real ? realProfileService : mockProfileService

export * from './types'
