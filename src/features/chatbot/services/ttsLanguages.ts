export const CHATBOT_TTS_LANGUAGES = [
    'en',
    'bn',
    'hi',
    'pa',
    'te',
    'ta',
    'mr',
    'gu',
    'kn',
    'ml',
    'or',
    'as',
] as const

export type ChatbotTtsLanguage = (typeof CHATBOT_TTS_LANGUAGES)[number]

export const CHATBOT_TTS_LANGUAGE_SET = new Set<string>(CHATBOT_TTS_LANGUAGES)
