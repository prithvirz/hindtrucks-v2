// ─── AI Chatbot Types ───

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    language: string
    timestamp: number
    suggestedActions?: SuggestedAction[]
    isStreaming?: boolean
    isError?: boolean
}

export interface SuggestedAction {
    id: string
    label: string
    icon?: string
    action: 'accept_load' | 'view_load' | 'start_trip' | 'view_earnings' | 'update_profile' | 'navigate' | 'call_support'
    payload?: {
        loadId?: string
        route?: string
        phoneNumber?: string
    }
}

export interface ChatContext {
    driverName: string
    driverLanguage: string
    activeLoadId: string | null
    tripStep: number
    walletBalance: number
    recentEarnings: number
    unreadNotifications: number
    isOnline: boolean
}

export type ChatStreamEvent =
    | { type: 'token'; content: string }
    | { type: 'action'; action: SuggestedAction }
    | { type: 'error'; message: string }
    | { type: 'done' }

export interface ChatState {
    messages: ChatMessage[]
    isOpen: boolean
    isStreaming: boolean
    fallbackMode: boolean
    context: ChatContext
}

export interface FaqEntry {
    key: string
    path: string
    keywords: string[]
}