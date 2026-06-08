import { useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import {
    normalizeTtsLanguage,
    speakNativeTts,
    stopNativeTts,
} from '../services/hindTrucksTts'

// ─── useTTS: Text-to-Speech Hook ───
// Uses native Android TTS inside the app and Web Speech in the browser.

const LANG_MAP: Record<string, string[]> = {
    en: ['en-IN', 'en-US', 'en-GB', 'en'],
    hi: ['hi-IN', 'hi'],
    pa: ['pa-IN', 'pa'],
    ta: ['ta-IN', 'ta'],
    te: ['te-IN', 'te'],
    bn: ['bn-IN', 'bn-BD', 'bn'],
    mr: ['mr-IN', 'mr'],
    gu: ['gu-IN', 'gu'],
    kn: ['kn-IN', 'kn'],
    ml: ['ml-IN', 'ml'],
    or: ['or-IN', 'or'],
    as: ['as-IN', 'as'],
}

const VOICE_LOAD_TIMEOUT_MS = 700

export type TtsSpeakStatus =
    | 'spoken'
    | 'missing-language'
    | 'unsupported'
    | 'cancelled'
    | 'empty'
    | 'failed'

export interface TtsSpeakResult {
    status: TtsSpeakStatus
    lang?: string
    usedNative: boolean
    reason?: string
}

function normalizeLangCode(langCode: string) {
    return (langCode || 'en').toLowerCase().replace('_', '-').split('-')[0]
}

export function getTtsLocales(langCode: string) {
    const normalized = normalizeLangCode(langCode)
    return LANG_MAP[normalized] || LANG_MAP.en
}

export function getNativeTtsLanguageCode(langCode: string) {
    return normalizeTtsLanguage(langCode)
}

export function resolveTtsVoice(voices: SpeechSynthesisVoice[], langCode: string) {
    const normalized = normalizeLangCode(langCode)
    const targetLocales = getTtsLocales(langCode)

    for (const locale of targetLocales) {
        const exactMatch = voices.find(
            (voice) => voice.lang.toLowerCase().replace('_', '-') === locale.toLowerCase()
        )
        if (exactMatch) return exactMatch
    }

    return voices.find((voice) =>
        voice.lang.toLowerCase().replace('_', '-').startsWith(`${normalized}-`)
            || voice.lang.toLowerCase() === normalized
    )
}

function waitForVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
    const voices = synth.getVoices()
    if (voices.length > 0) return Promise.resolve(voices)

    return new Promise((resolve) => {
        let settled = false
        let timeoutId: number | undefined
        const hasEventTarget = typeof synth.addEventListener === 'function'

        const finish = () => {
            if (settled) return
            settled = true
            if (timeoutId !== undefined) window.clearTimeout(timeoutId)
            if (hasEventTarget) {
                synth.removeEventListener('voiceschanged', finish)
            } else if (synth.onvoiceschanged === finish) {
                synth.onvoiceschanged = null
            }
            resolve(synth.getVoices())
        }

        if (hasEventTarget) {
            synth.addEventListener('voiceschanged', finish)
        } else {
            synth.onvoiceschanged = finish
        }

        timeoutId = window.setTimeout(finish, VOICE_LOAD_TIMEOUT_MS)
    })
}

export function useTTS() {
    const requestIdRef = useRef(0)

    const speakNative = useCallback(async (text: string, langCode: string): Promise<TtsSpeakResult> => {
        const result = await speakNativeTts(text, langCode)
        return {
            status: result.status,
            lang: result.lang,
            usedNative: true,
            reason: result.reason,
        }
    }, [])

    const speakWeb = useCallback(async (text: string, langCode: string): Promise<TtsSpeakResult> => {
        if (
            typeof window === 'undefined'
            || !('speechSynthesis' in window)
            || typeof SpeechSynthesisUtterance === 'undefined'
            || !text.trim()
        ) {
            return { status: text.trim() ? 'unsupported' : 'empty', usedNative: false }
        }

        const requestId = requestIdRef.current + 1
        requestIdRef.current = requestId
        const synth = window.speechSynthesis

        synth.cancel()
        const voices = await waitForVoices(synth)
        if (requestIdRef.current !== requestId) {
            return { status: 'cancelled', usedNative: false }
        }

        const utterance = new SpeechSynthesisUtterance(text)
        const targetLocales = getTtsLocales(langCode)
        const matchingVoice = resolveTtsVoice(voices, langCode)

        if (matchingVoice) {
            utterance.voice = matchingVoice
        }
        utterance.lang = targetLocales[0]
        utterance.rate = 0.9

        synth.speak(utterance)
        return { status: 'spoken', lang: utterance.lang, usedNative: false }
    }, [])

    const speak = useCallback(async (text: string, langCode: string): Promise<TtsSpeakResult> => {
        if (!text.trim()) {
            return { status: 'empty', usedNative: Capacitor.isNativePlatform() }
        }

        if (Capacitor.isNativePlatform()) {
            try {
                return await speakNative(text, langCode)
            } catch {
                return { status: 'failed', usedNative: true }
            }
        }

        return speakWeb(text, langCode)
    }, [speakNative, speakWeb])

    const cancel = useCallback(() => {
        requestIdRef.current += 1
        if (Capacitor.isNativePlatform()) {
            stopNativeTts().catch(() => { })
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
        }
    }, [])

    const isSupported =
        Capacitor.isNativePlatform()
        || (typeof window !== 'undefined'
            && 'speechSynthesis' in window
            && typeof SpeechSynthesisUtterance !== 'undefined')

    return { speak, cancel, isSupported }
}
