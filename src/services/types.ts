import type { Load, GoodsKey, Payout } from '../data/mockLoads'
import type { TripStep, DriverProfile } from '../state/types'
import type { PaginatedRequest, PaginatedResponse } from './errors'

// Re-export domain types
export type { Load, GoodsKey, Payout, TripStep, DriverProfile }
export type { PaginatedRequest, PaginatedResponse }

// ── Auth Types ──

export interface SendOtpRequest {
    phone: string
}

export interface VerifyOtpRequest {
    phone: string
    otp: string
}

export interface LogoutRequest {
    refreshToken?: string
}

export interface TokenPair {
    access: { token: string; expiresAt: number }
    refresh: { token: string; expiresAt: number }
}

export interface SendOtpResponse {
    success: boolean
    retryAfterSeconds: number
    expiresInSeconds: number
}

export interface VerifyOtpResponse {
    success: boolean
    tokens: TokenPair
    isNewUser: boolean
}

export interface SessionCheckResponse {
    valid: boolean
    phone?: string
}

export interface IAuthService {
    sendOtp(request: SendOtpRequest): Promise<SendOtpResponse>
    verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse>
    logout(request?: LogoutRequest): Promise<void>
    checkSession(): Promise<SessionCheckResponse>
}

// ── Loads Types ──

export interface GetLoadsRequest extends PaginatedRequest {
    goods?: GoodsKey
    minPrice?: number
    maxPrice?: number
    fromCity?: string
    toCity?: string
}

export interface GetLoadDetailRequest {
    loadId: string
}

export interface AcceptLoadRequest {
    loadId: string
}

export type GetLoadsResponse = PaginatedResponse<Load>

export interface GetLoadDetailResponse {
    load: Load
}

export interface AcceptLoadResponse {
    success: boolean
    activeLoad: Load
    tripStep: 1
}

export interface ILoadsService {
    getLoads(request?: GetLoadsRequest): Promise<GetLoadsResponse>
    getLoadDetail(request: GetLoadDetailRequest): Promise<GetLoadDetailResponse>
    acceptLoad(request: AcceptLoadRequest): Promise<AcceptLoadResponse>
}

// ── Trip Types ──

export interface AdvanceStepRequest {
    currentStep: TripStep
}

export interface CompleteTripRequest {
    loadId: string
}

export interface AdvanceStepResponse {
    newStep: TripStep
    message?: string
}

export interface CompleteTripResponse {
    success: boolean
    payoutAmount: number
    payoutId: string
}

export interface GetActiveTripResponse {
    activeLoad: Load | null
    tripStep: TripStep
}

export interface ITripService {
    getActiveTrip(): Promise<GetActiveTripResponse>
    advanceStep(request: AdvanceStepRequest): Promise<AdvanceStepResponse>
    completeTrip(request: CompleteTripRequest): Promise<CompleteTripResponse>
}

// ── Earnings Types ──

export interface WithdrawRequest {
    amount: number
    upiId: string
}

export interface GetPayoutsResponse {
    payouts: Payout[]
}

export interface GetWeekEarningsResponse {
    earnings: number[]
}

export interface GetWalletBalanceResponse {
    balance: number
}

export interface WithdrawResponse {
    success: boolean
    newBalance: number
    transaction: Payout
}

export interface IEarningsService {
    getPayouts(): Promise<GetPayoutsResponse>
    getWeekEarnings(): Promise<GetWeekEarningsResponse>
    getWalletBalance(): Promise<GetWalletBalanceResponse>
    withdraw(request: WithdrawRequest): Promise<WithdrawResponse>
}

// ── Profile Types ──

export interface UpdateProfileRequest {
    name?: string
}

export interface SetOnlineStatusRequest {
    isOnline: boolean
}

export interface CreateDriverProfileRequest {
    name: string
    phone: string
}

export interface GetProfileResponse {
    profile: DriverProfile
}

export interface RegistrationStatusResponse {
    registered: boolean
}

export interface SetOnlineStatusResponse {
    isOnline: boolean
}

export interface IProfileService {
    getProfile(): Promise<GetProfileResponse>
    getRegistrationStatus(): Promise<RegistrationStatusResponse>
    createDriverProfile(request: CreateDriverProfileRequest): Promise<GetProfileResponse>
    setOnlineStatus(request: SetOnlineStatusRequest): Promise<SetOnlineStatusResponse>
}

// ── Chat Types ──

export interface ChatMessage {
    id: string
    sender: 'user' | 'bot'
    text: string
    isTyping?: boolean
    redirectPath?: string
    redirectMsg?: string
}

export interface SendMessageRequest {
    message: string
    conversationId?: string
    locale?: string
}

export interface SendMessageResponse {
    reply: ChatMessage
    conversationId: string
    suggestedActions?: string[]
}

export interface IChatService {
    sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>
}
