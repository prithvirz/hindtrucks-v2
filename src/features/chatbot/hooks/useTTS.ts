import { useCallback } from 'react'

// ─── useTTS: Text-to-Speech Hook ───
// Extracted from AIChatbot.tsx speakText() function.
// Supports 5 Indic languages via Web Speech API.

const LANG_MAP: Record<string, string[]> = {
    hi: ['hi-IN', 'hi'],
    ta: ['ta-IN', 'ta'],
    te: ['te-IN', 'te'],
    pa: ['pa-IN', 'pa'],
    en: ['en-IN', 'en-US', 'en-GB', 'en'],
}

export function useTTS() {
    const speak = useCallback((text: string, langCode: string) => {
        if (!('speechSynthesis' in window)) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        const voices = window.speechSynthesis.getVoices()

        const targetLocales = LANG_MAP[langCode] || ['en-US']
        let matchingVoice: SpeechSynthesisVoice | undefined = undefined

        for (const locale of targetLocales) {
            matchingVoice = voices.find(
                (v) => v.lang.toLowerCase().replace('_', '-') === locale.toLowerCase()
            )
            if (matchingVoice) break
        }

        if (!matchingVoice) {
            matchingVoice = voices.find((v) =>
                v.lang.toLowerCase().startsWith(langCode)
            )
        }

        if (matchingVoice) {
            utterance.voice = matchingVoice
        }
        utterance.lang = targetLocales[0]
        utterance.rate = 0.9

        window.speechSynthesis.speak(utterance)
    }, [])

    const cancel = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
    }, [])

    return { speak, cancel }
}