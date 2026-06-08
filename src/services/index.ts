import type {
    IAuthService,
    ILoadsService,
    ITripService,
    IEarningsService,
    IProfileService,
    IChatService,
} from './types'

import { mockAuthService } from './mock/authService'
import { mockLoadsService } from './mock/loadsService'
import { mockTripService } from './mock/tripService'
import { mockEarningsService } from './mock/earningsService'
import { mockProfileService } from './mock/profileService'
import { mockChatService } from './mock/chatService'

import { authService as realAuthService } from './real/authService'
import { loadsService as realLoadsService } from './real/loadsService'
import { tripService as realTripService } from './real/tripService'
import { earningsService as realEarningsService } from './real/earningsService'
import { profileService as realProfileService } from './real/profileService'
import { chatService as realChatService } from './real/chatService'

const MODE: 'mock' | 'real' =
    (import.meta.env.VITE_API_MODE as 'mock' | 'real') || 'mock'

let _auth: IAuthService
let _loads: ILoadsService
let _trip: ITripService
let _earnings: IEarningsService
let _profile: IProfileService
let _chat: IChatService

function getServices() {
    if (MODE === 'mock') {
        return {
            auth: mockAuthService,
            loads: mockLoadsService,
            trip: mockTripService,
            earnings: mockEarningsService,
            profile: mockProfileService,
            chat: mockChatService,
        }
    }

    // Real mode — singleton initialization
    if (!_auth) {
        _auth = realAuthService
        _loads = realLoadsService
        _trip = realTripService
        _earnings = realEarningsService
        _profile = realProfileService
        _chat = realChatService
    }

    return {
        auth: _auth,
        loads: _loads,
        trip: _trip,
        earnings: _earnings,
        profile: _profile,
        chat: _chat,
    }
}

// ── Exported Service Instances ──

export const authService: IAuthService = {
    sendOtp: (...args) => getServices().auth.sendOtp(...args),
    verifyOtp: (...args) => getServices().auth.verifyOtp(...args),
    logout: (...args) => getServices().auth.logout(...args),
    checkSession: (...args) => getServices().auth.checkSession(...args),
}

export const loadsService: ILoadsService = {
    getLoads: (...args) => getServices().loads.getLoads(...args),
    getLoadDetail: (...args) => getServices().loads.getLoadDetail(...args),
    acceptLoad: (...args) => getServices().loads.acceptLoad(...args),
}

export const tripService: ITripService = {
    getActiveTrip: (...args) => getServices().trip.getActiveTrip(...args),
    advanceStep: (...args) => getServices().trip.advanceStep(...args),
    completeTrip: (...args) => getServices().trip.completeTrip(...args),
}

export const earningsService: IEarningsService = {
    getPayouts: (...args) => getServices().earnings.getPayouts(...args),
    getWeekEarnings: (...args) => getServices().earnings.getWeekEarnings(...args),
    getWalletBalance: (...args) => getServices().earnings.getWalletBalance(...args),
    withdraw: (...args) => getServices().earnings.withdraw(...args),
}

export const profileService: IProfileService = {
    getProfile: (...args) => getServices().profile.getProfile(...args),
    getRegistrationStatus: (...args) => getServices().profile.getRegistrationStatus(...args),
    createDriverProfile: (...args) => getServices().profile.createDriverProfile(...args),
    setOnlineStatus: (...args) => getServices().profile.setOnlineStatus(...args),
}

export const chatService: IChatService = {
    sendMessage: (...args) => getServices().chat.sendMessage(...args),
}

// Re-export types
export * from './types'
export * from './errors'
