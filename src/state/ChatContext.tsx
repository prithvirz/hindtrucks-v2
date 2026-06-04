import { type ReactNode, createContext, useContext, useState, useCallback } from 'react'
import type { ChatMessage } from '../features/chatbot/types'
import { useChat } from '../features/chatbot/hooks/useChat'

// ─── ChatContext: Focused Chat State Provider ───

interface ChatContextValue {
    messages: ChatMessage[]
    isOpen: boolean
    isStreaming: boolean
    openChat: () => void
    closeChat: () => void
    toggleChat: () => void
    sendMessage: (text: string) => void
    clearChat: () => void
    retryLast: () => void
}

const ChatCtx = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const { messages, isStreaming, sendMessage, clearChat, retryLast } = useChat()

    const openChat = useCallback(() => setIsOpen(true), [])
    const closeChat = useCallback(() => {
        setIsOpen(false)
        clearChat()
    }, [clearChat])
    const toggleChat = useCallback(() => {
        setIsOpen((prev) => {
            if (prev) clearChat()
            return !prev
        })
    }, [clearChat])

    return (
        <ChatCtx.Provider
            value={{
                messages,
                isOpen,
                isStreaming,
                openChat,
                closeChat,
                toggleChat,
                sendMessage,
                clearChat,
                retryLast,
            }}
        >
            {children}
        </ChatCtx.Provider>
    )
}

export function useChatContext(): ChatContextValue {
    const ctx = useContext(ChatCtx)
    if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
    return ctx
}