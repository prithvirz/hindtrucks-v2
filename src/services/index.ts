import type {
    IAuthService,
    ILoadsService,
    ITripService,
    IEarningsService,
    IProfileService,
    IChatService,
    INotificationsService,
} from './types'

import { mockAuthService } from './mock/authService'
import { mockLoadsService } from './mock/loadsService'
import { mockTripService } from './mock/tripService'
import { mockEarningsService } from './mock/earningsService'
import { mockProfileService } from './mock/profileService'
import { mockChatService } from './mock/chatService'
import { createMockNotificationsService } from './mock/notificationsService'

import { authService as realAuthService } from './real/authService'
import { loadsService as realLoadsService } from './real/loadsService'
import { tripService as realTripService } from './real/tripService'
import { earningsService as realEarningsService } from './real/earningsService'
import { profileService as realProfileService } from './real/profileService'
import { chatService as realChatService } from './real/chatService'
import { createRealNotificationsService } from './real/notificationsService'

// ── Service Mode Resolution ──

type ServiceMode = 'mock' | 'real'
type ApiMode = 'mock' | 'real' | 'hybrid'

const API_MODE: ApiMode =
    (import.meta.env.VITE_API_MODE as ApiMode) || 'mock'

/** Resolve a single service's mode. In hybrid mode, read per-service env var;
 *  in mock/real mode, all services follow the global setting. */
function resolveServiceMode(serviceKey: string): ServiceMode {
    if (API_MODE === 'mock') return 'mock'
    if (API_MODE === 'real') return 'real'
    // hybrid: per-service env var, default mock
    const perService = import.meta.env[`VITE_API_${serviceKey.toUpperCase()}`] as ServiceMode | undefined
    return perService === 'real' ? 'real' : 'mock'
}

// ── Service Implementations Map ──

const MOCK_SERVICES = {
    auth: mockAuthService,
    loads: mockLoadsService,
    trip: mockTripService,
    earnings: mockEarningsService,
    profile: mockProfileService,
    chat: mockChatService,
    notifications: createMockNotificationsService(),
}

const REAL_SERVICES = {
    auth: realAuthService,
    loads: realLoadsService,
    trip: realTripService,
    earnings: realEarningsService,
    profile: realProfileService,
    chat: realChatService,
    notifications: createRealNotificationsService(),
}

// ── Resolved Service Instances (computed once at module load) ──

const SERVICES = {
    auth: resolveServiceMode('auth') === 'real' ? REAL_SERVICES.auth : MOCK_SERVICES.auth,
    loads: resolveServiceMode('loads') === 'real' ? REAL_SERVICES.loads : MOCK_SERVICES.loads,
    trip: resolveServiceMode('trip') === 'real' ? REAL_SERVICES.trip : MOCK_SERVICES.trip,
    earnings: resolveServiceMode('earnings') === 'real' ? REAL_SERVICES.earnings : MOCK_SERVICES.earnings,
    profile: resolveServiceMode('profile') === 'real' ? REAL_SERVICES.profile : MOCK_SERVICES.profile,
    chat: resolveServiceMode('chat') === 'real' ? REAL_SERVICES.chat : MOCK_SERVICES.chat,
    notifications:
        resolveServiceMode('notifications') === 'real'
            ? REAL_SERVICES.notifications
            : MOCK_SERVICES.notifications,
}

function getServices() {
    return SERVICES
}

/** Whether a specific service is using its real implementation.
 *  Use this instead of raw VITE_API_MODE checks in consumers. */
export function isServiceReal(serviceKey: keyof typeof SERVICES): boolean {
    return resolveServiceMode(serviceKey) === 'real'
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
    reportLocation: (...args) => getServices().trip.reportLocation(...args),
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

export const notificationsService: INotificationsService = {
    registerToken: (...args) => getServices().notifications.registerToken(...args),
    unregisterToken: (...args) => getServices().notifications.unregisterToken(...args),
    subscribeToTopic: (...args) => getServices().notifications.subscribeToTopic(...args),
    unsubscribeFromTopic: (...args) => getServices().notifications.unsubscribeFromTopic(...args),
    getHistory: (...args) => getServices().notifications.getHistory(...args),
    markRead: (...args) => getServices().notifications.markRead(...args),
    markAllRead: (...args) => getServices().notifications.markAllRead(...args),
}

// Re-export types
export * from './types'
export * from './errors'
