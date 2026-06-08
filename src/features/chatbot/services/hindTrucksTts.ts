import { registerPlugin } from '@capacitor/core'
import { CHATBOT_TTS_LANGUAGE_SET } from './ttsLanguages'

export type HindTrucksTtsStatus = 'spoken' | 'missing-language' | 'empty' | 'failed'

export interface HindTrucksTtsSpeakOptions {
    text: string
    lang: string
}

export interface HindTrucksTtsSpeakResult {
    status: HindTrucksTtsStatus
    lang: string
    reason?: string
}

export interface HindTrucksTtsLanguageResult {
    available: boolean
    lang: string
    reason?: string
}

export interface HindTrucksTtsLanguagesResult {
    languages: string[]
    configuredLanguages: string[]
    engine: string
    ready: boolean
}

export interface HindTrucksTtsPlugin {
    speak(options: HindTrucksTtsSpeakOptions): Promise<HindTrucksTtsSpeakResult>
    stop(): Promise<void>
    isLanguageAvailable(options: { lang: string }): Promise<HindTrucksTtsLanguageResult>
    getAvailableLanguages(): Promise<HindTrucksTtsLanguagesResult>
}

export const HindTrucksTts = registerPlugin<HindTrucksTtsPlugin>('HindTrucksTts')

export function normalizeTtsLanguage(langCode: string) {
    return (langCode || 'en').toLowerCase().replace('_', '-').split('-')[0]
}

export async function speakNativeTts(text: string, langCode: string) {
    const lang = normalizeTtsLanguage(langCode)
    if (!CHATBOT_TTS_LANGUAGE_SET.has(lang)) {
        return {
            status: 'missing-language' as const,
            lang,
            reason: 'Unsupported HindTrucks language code',
        }
    }

    return HindTrucksTts.speak({
        text,
        lang,
    })
}

export async function stopNativeTts() {
    await HindTrucksTts.stop()
}

export async function isNativeTtsLanguageAvailable(langCode: string) {
    return HindTrucksTts.isLanguageAvailable({
        lang: normalizeTtsLanguage(langCode),
    })
}

export async function getNativeTtsLanguages() {
    return HindTrucksTts.getAvailableLanguages()
}
