import { useTranslation } from 'react-i18next'
import { staticFaqMatch } from '../services/chatService'

// ─── ChatFallback: Static FAQ Keyword Matching ───
// Preserved from AIChatbot.tsx. Used when API is unreachable or VITE_API_MODE=mock.
// The FAQ data lives in src/data/staticFaqs.ts, imported by chatService.

interface ChatFallbackProps {
    userInput: string
    language: string
    onResult: (reply: string, redirectPath?: string, redirectMsg?: string) => void
}

export function ChatFallback({ userInput, language, onResult }: ChatFallbackProps) {
    const { t } = useTranslation()

    // Immediately compute and report result on render/mount
    const result = staticFaqMatch(userInput, language, t)

    // Report result via effect so parent can handle it
    import('react').then(() => {
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
            onResult(result.reply, result.redirectPath, result.redirectMsg)
        }, 0)
    })

    return null
}

// Hook variant for programmatic use
export function useChatFallback() {
    const { t } = useTranslation()

    function matchQuery(text: string, language: string) {
        return staticFaqMatch(text, language, t)
    }

    return { matchQuery }
}