import type { ChatContext, ChatMessage, ChatStreamEvent } from '../types'
import { FAQS_LIST } from '../../../data/staticFaqs'
import type { TFunction } from 'i18next'
import { isServiceReal } from '../../../services/index'

// ─── Chat Service: SSE Client + Static FAQ Fallback ───

function getAuthToken(): string | null {
    return localStorage.getItem('ht_auth_token')
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export async function* streamChatMessage(
    text: string,
    context: ChatContext,
    history: ChatMessage[],
    signal: AbortSignal
): AsyncGenerator<ChatStreamEvent, void, undefined> {
    const token = getAuthToken()

    const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            text,
            context,
            history: history.slice(-10),
        }),
        signal,
    })

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
    }

    if (!response.body) {
        throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const payload = line.slice(6).trim()
                    if (payload === '[DONE]') {
                        yield { type: 'done' }
                        return
                    }
                    try {
                        const event: ChatStreamEvent = JSON.parse(payload)
                        yield event
                    } catch {
                        // Skip malformed SSE lines
                    }
                }
            }
        }

        // Process remaining buffer
        if (buffer.startsWith('data: ')) {
            const payload = buffer.slice(6).trim()
            if (payload === '[DONE]') {
                yield { type: 'done' }
                return
            }
            try {
                const event: ChatStreamEvent = JSON.parse(payload)
                yield event
            } catch {
                // Skip
            }
        }

        yield { type: 'done' }
    } finally {
        reader.releaseLock()
    }
}

// ─── Static FAQ Fallback ───

export interface FaqMatchResult {
    reply: string
    redirectPath?: string
    redirectMsg?: string
}

export function staticFaqMatch(
    text: string,
    _language: string,
    t: TFunction
): FaqMatchResult {
    const normalizedInput = text.toLowerCase().trim()

    const matchedFaq = FAQS_LIST.find((f) => {
        const questionText = t(`bot.faq_${f.key}_q`).toLowerCase()
        return (
            normalizedInput.includes(questionText) ||
            questionText.includes(normalizedInput) ||
            f.keywords.some((kw) => normalizedInput.includes(kw.toLowerCase()))
        )
    })

    if (matchedFaq) {
        return {
            reply: t(`bot.faq_${matchedFaq.key}_a`),
            redirectPath: matchedFaq.path,
            redirectMsg: t(`bot.faq_${matchedFaq.key}_redirect`),
        }
    }

    return { reply: t('bot.fallback') }
}

export function shouldUseStaticFallback(): boolean {
    return !isServiceReal('chat') || !navigator.onLine
}

export async function getChatHistory(): Promise<ChatMessage[]> {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/chat/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error(`History API error: ${response.status}`)
    const data = await response.json()
    return data.messages || []
}

export async function clearChatHistory(): Promise<void> {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE}/chat/history`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error(`Clear history error: ${response.status}`)
}