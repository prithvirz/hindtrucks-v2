import type { IAuthService, IBookingService, ITrackingService, IProfileService } from './types'

import { mockAuthService } from './mock/authService'
import { mockBookingService } from './mock/bookingService'
import { mockTrackingService } from './mock/trackingService'
import { mockProfileService } from './mock/profileService'

import { realAuthService, realBookingService, realTrackingService, realProfileService } from './real'

import { authService as firebaseAuthService, bookingService as firebaseBookingService, trackingService as firebaseTrackingService, profileService as firebaseProfileService } from './firebase'

const MODE = (import.meta.env.VITE_API_MODE as 'mock' | 'real' | 'firebase') || 'mock'

export const authService: IAuthService =
    MODE === 'firebase' ? firebaseAuthService :
        MODE === 'real' ? realAuthService :
            mockAuthService

export const bookingService: IBookingService =
    MODE === 'firebase' ? firebaseBookingService :
        MODE === 'real' ? realBookingService :
            mockBookingService

export const trackingService: ITrackingService =
    MODE === 'firebase' ? firebaseTrackingService :
        MODE === 'real' ? realTrackingService :
            mockTrackingService

export const profileService: IProfileService =
    MODE === 'firebase' ? firebaseProfileService :
        MODE === 'real' ? realProfileService :
            mockProfileService

export * from './types'
