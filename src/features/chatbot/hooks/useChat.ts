import { useCallback, useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChatMessage } from '../types'
import { streamChatMessage, staticFaqMatch, shouldUseStaticFallback } from '../services/chatService'
import { useChatHistory } from './useChatHistory'
import { useAIContext } from './useAIContext'

// ─── useChat: Send/Receive Chat Messages with SSE Streaming ───

export function useChat() {
    const { t, i18n } = useTranslation()
    const { messages, setMessages, addMessage, clearHistory } = useChatHistory()
    const context = useAIContext()
    const abortRef = useRef<AbortController | null>(null)
    const isStreamingRef = useRef(false)
    const [translationTrigger, setTranslationTrigger] = useState(0)

    // Listen to added resources to re-translate when lazy loaded bundles load
    useEffect(() => {
        const handleAdded = () => {
            setTranslationTrigger((prev) => prev + 1)
        }
        i18n.on('added', handleAdded)
        return () => {
            i18n.off('added', handleAdded)
        }
    }, [i18n])

    // Proactively greet the driver and display a found job/load match message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMsg: ChatMessage = {
                id: 'welcome',
                role: 'assistant',
                content: t('bot.welcome_greet', { name: context.driverName || 'Driver' }),
                language: context.driverLanguage,
                timestamp: Date.now(),
                suggestedActions: [
                    {
                        id: 'welcome-view-loads',
                        label: t('bot.welcome_view_loads_btn', 'View Matches'),
                        action: 'navigate',
                        payload: { route: '/loads' }
                    }
                ]
            }
            setMessages([welcomeMsg])
        }
    }, [messages.length, context.driverName, context.driverLanguage, setMessages, t])

    // Re-translate the static welcome message when the UI language changes or translation resources are loaded
    useEffect(() => {
        setMessages((prev) =>
            prev.some((m) => m.id === 'welcome')
                ? prev.map((m) =>
                      m.id === 'welcome'
                          ? {
                                ...m,
                                content: t('bot.welcome_greet', { name: context.driverName || 'Driver' }),
                                language: context.driverLanguage,
                                suggestedActions: [
                                    {
                                        id: 'welcome-view-loads',
                                        label: t('bot.welcome_view_loads_btn', 'View Matches'),
                                        action: 'navigate',
                                        payload: { route: '/loads' },
                                    },
                                ],
                            }
                          : m
                  )
                : prev
        )
    }, [i18n.language, translationTrigger, context.driverName, context.driverLanguage, setMessages, t])

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isStreamingRef.current) return

            const userMsg: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: text.trim(),
                language: context.driverLanguage,
                timestamp: Date.now(),
            }

            setMessages((prev) => [...prev, userMsg])
            addMessage(userMsg).catch(() => { })

            const assistantId = `assistant-${Date.now() + 1}`

            const assistantMsg: ChatMessage = {
                id: assistantId,
                role: 'assistant',
                content: '',
                language: context.driverLanguage,
                timestamp: Date.now(),
                isStreaming: true,
            }

            setMessages((prev) => [...prev, assistantMsg])

            // Check if static fallback should be used
            if (shouldUseStaticFallback()) {
                const result = staticFaqMatch(text, context.driverLanguage, t)

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                ...m,
                                content: result.reply,
                                isStreaming: false,
                                suggestedActions: result.redirectPath
                                    ? [
                                        {
                                            id: 'navigate',
                                            label: result.redirectMsg || t('bot.go_now'),
                                            action: 'navigate' as const,
                                            payload: { route: result.redirectPath },
                                        },
                                    ]
                                    : undefined,
                            }
                            : m
                    )
                )
                return
            }

            // SSE streaming path
            const abortController = new AbortController()
            abortRef.current = abortController
            isStreamingRef.current = true

            let fullContent = ''
            let streamError = false

            try {
                for await (const event of streamChatMessage(
                    text,
                    context,
                    messages,
                    abortController.signal
                )) {
                    if (event.type === 'token') {
                        fullContent += event.content
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? { ...m, content: fullContent, isStreaming: true }
                                    : m
                            )
                        )
                    } else if (event.type === 'action') {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === assistantId
                                    ? {
                                        ...m,
                                        suggestedActions: [...(m.suggestedActions || []), event.action],
                                    }
                                    : m
                            )
                        )
                    } else if (event.type === 'error') {
                        streamError = true
                        fullContent = event.message
                        break
                    } else if (event.type === 'done') {
                        break
                    }
                }
            } catch {
                streamError = true
            }

            isStreamingRef.current = false

            if (streamError || !fullContent) {
                // Fallback to static FAQ
                const result = staticFaqMatch(text, context.driverLanguage, t)

                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? {
                                ...m,
                                content: result.reply,
                                isStreaming: false,
                                isError: streamError,
                                suggestedActions: result.redirectPath
                                    ? [
                                        {
                                            id: 'navigate',
                                            label: result.redirectMsg || t('bot.go_now'),
                                            action: 'navigate' as const,
                                            payload: { route: result.redirectPath },
                                        },
                                    ]
                                    : undefined,
                            }
                            : m
                    )
                )
            } else {
                // Finalize streaming message
                const finalMsg: ChatMessage = {
                    id: assistantId,
                    role: 'assistant',
                    content: fullContent,
                    language: context.driverLanguage,
                    timestamp: Date.now(),
                    isStreaming: false,
                }

                setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? finalMsg : m))
                )
                addMessage(finalMsg).catch(() => { })
            }
        },
        [context, messages, t, setMessages, addMessage]
    )

    const clearChat = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }
        isStreamingRef.current = false
        clearHistory()
    }, [clearHistory])

    const retryLast = useCallback(() => {
        // Find last user message and resend
        const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
        if (lastUserMsg) {
            sendMessage(lastUserMsg.content)
        }
    }, [messages, sendMessage])

    return {
        messages,
        isStreaming: isStreamingRef.current,
        sendMessage,
        clearChat,
        retryLast,
    }
}