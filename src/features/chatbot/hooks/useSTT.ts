import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

// ─── useSTT: Speech-to-Text Hook ───
// Extracted from AIChatbot.tsx toggleListening() / SpeechRecognition logic.
// Supports 5 Indic languages via browser SpeechRecognition API.

const LANG_MAP: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    pa: 'pa-IN',
}

export function useSTT(onResult: (text: string) => void) {
    const { i18n } = useTranslation()
    const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const hasSpeechSupport = !!SpeechRecognition

    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (!SpeechRecognition) return

        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false

        rec.onstart = () => setIsListening(true)

        rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onResult(transcript)
        }

        rec.onerror = (event: any) => {
            console.error('Speech recognition error', event.error)
            setIsListening(false)
        }

        rec.onend = () => setIsListening(false)

        recognitionRef.current = rec

        return () => {
            rec.abort()
        }
    }, [SpeechRecognition, onResult])

    // Update recognition language when i18n language changes
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang =
                LANG_MAP[i18n.language] || 'hi-IN'
        }
    }, [i18n.language])

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return
        if (isListening) {
            recognitionRef.current.stop()
        } else {
            try {
                recognitionRef.current.start()
            } catch {
                // Already started or not supported
            }
        }
    }, [isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
    }, [isListening])

    return { isListening, hasSpeechSupport, toggleListening, stopListening }
}