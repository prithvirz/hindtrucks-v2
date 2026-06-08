import { act, renderHook, waitFor } from '@testing-library/react'
import { Capacitor } from '@capacitor/core'
import {
    getNativeTtsLanguageCode,
    getTtsLocales,
    resolveTtsVoice,
    type TtsSpeakResult,
    useTTS,
} from './useTTS'
import { speakNativeTts, stopNativeTts } from '../services/hindTrucksTts'

vi.mock('@capacitor/core', async () => {
    const actual = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core')
    return {
        ...actual,
        Capacitor: {
            ...actual.Capacitor,
            isNativePlatform: vi.fn(() => false),
        },
        registerPlugin: vi.fn(() => ({
            speak: vi.fn(),
            stop: vi.fn(),
            isLanguageAvailable: vi.fn(),
            getAvailableLanguages: vi.fn(),
        })),
    }
})

vi.mock('../services/hindTrucksTts', async () => {
    const actual = await vi.importActual<typeof import('../services/hindTrucksTts')>('../services/hindTrucksTts')
    return {
        ...actual,
        speakNativeTts: vi.fn(),
        stopNativeTts: vi.fn(),
    }
})

class MockSpeechSynthesisUtterance {
    text: string
    lang = ''
    rate = 1
    voice: SpeechSynthesisVoice | null = null

    constructor(text: string) {
        this.text = text
    }
}

function makeVoice(lang: string, name = lang): SpeechSynthesisVoice {
    return {
        default: false,
        lang,
        localService: true,
        name,
        voiceURI: name,
    }
}

describe('useTTS', () => {
    let voices: SpeechSynthesisVoice[]
    let voicesChangedHandler: (() => void) | null
    let synth: SpeechSynthesis

    beforeEach(() => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
        vi.mocked(speakNativeTts).mockResolvedValue({
            status: 'spoken',
            lang: 'en',
        })
        vi.mocked(stopNativeTts).mockResolvedValue(undefined)
        voices = []
        voicesChangedHandler = null

        synth = {
            speak: vi.fn(),
            cancel: vi.fn(),
            getVoices: vi.fn(() => voices),
            addEventListener: vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
                if (event === 'voiceschanged') {
                    voicesChangedHandler =
                        typeof handler === 'function'
                            ? () => handler(new Event('voiceschanged'))
                            : () => handler.handleEvent(new Event('voiceschanged'))
                }
            }),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            onvoiceschanged: null,
            paused: false,
            pending: false,
            speaking: false,
            pause: vi.fn(),
            resume: vi.fn(),
        } as unknown as SpeechSynthesis

        Object.defineProperty(window, 'speechSynthesis', {
            configurable: true,
            writable: true,
            value: synth,
        })
        vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('maps every supported app language to an Indian locale where available', () => {
        expect(getTtsLocales('bn')).toContain('bn-IN')
        expect(getTtsLocales('gu')).toContain('gu-IN')
        expect(getTtsLocales('kn')).toContain('kn-IN')
        expect(getTtsLocales('ml')).toContain('ml-IN')
        expect(getTtsLocales('mr')).toContain('mr-IN')
        expect(getTtsLocales('or')).toContain('or-IN')
        expect(getTtsLocales('as')).toContain('as-IN')
    })

    it('normalizes region language codes and selects the matching voice', () => {
        const hindiVoice = makeVoice('hi-IN', 'Hindi')

        expect(resolveTtsVoice([hindiVoice], 'hi-IN')).toBe(hindiVoice)
    })

    it('maps the selected app language to the native plugin language code', () => {
        expect(getNativeTtsLanguageCode('hi-IN')).toBe('hi')
        expect(getNativeTtsLanguageCode('ml')).toBe('ml')
        expect(getNativeTtsLanguageCode('as-IN')).toBe('as')
    })

    it('waits for delayed WebView voices before speaking', async () => {
        const { result } = renderHook(() => useTTS())

        let didSpeak: Promise<TtsSpeakResult>
        await act(async () => {
            didSpeak = result.current.speak('नमस्ते', 'hi')
        })

        expect(synth.cancel).toHaveBeenCalled()
        expect(synth.speak).not.toHaveBeenCalled()

        voices = [makeVoice('hi-IN', 'Hindi')]
        act(() => {
            voicesChangedHandler?.()
        })

        await waitFor(() => {
            expect(synth.speak).toHaveBeenCalledTimes(1)
        })

        await expect(didSpeak!).resolves.toMatchObject({
            status: 'spoken',
            lang: 'hi-IN',
            usedNative: false,
        })
        const utterance = vi.mocked(synth.speak).mock.calls[0][0] as SpeechSynthesisUtterance
        expect(utterance.lang).toBe('hi-IN')
        expect(utterance.voice?.lang).toBe('hi-IN')
        expect(utterance.rate).toBe(0.9)
    })

    it('falls back to English for unknown language codes', async () => {
        voices = [makeVoice('en-IN', 'English India')]
        const { result } = renderHook(() => useTTS())

        await act(async () => {
            await result.current.speak('hello', 'unknown')
        })

        const utterance = vi.mocked(synth.speak).mock.calls[0][0] as SpeechSynthesisUtterance
        expect(utterance.lang).toBe('en-IN')
        expect(utterance.voice?.lang).toBe('en-IN')
    })

    it('uses HindTrucks native TTS on Android', async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
        vi.mocked(speakNativeTts).mockResolvedValue({
            status: 'spoken',
            lang: 'ta',
        })
        const { result } = renderHook(() => useTTS())

        await expect(result.current.speak('வணக்கம்', 'ta')).resolves.toMatchObject({
            status: 'spoken',
            lang: 'ta',
            usedNative: true,
        })

        expect(speakNativeTts).toHaveBeenCalledWith('வணக்கம்', 'ta')
        expect(synth.speak).not.toHaveBeenCalled()
    })

    it('returns controlled missing-language when Android cannot speak the language', async () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
        vi.mocked(speakNativeTts).mockResolvedValue({
            status: 'missing-language',
            lang: 'or',
            reason: 'This device cannot speak the selected app language',
        })
        const { result } = renderHook(() => useTTS())

        await expect(result.current.speak('ନମସ୍କାର', 'or')).resolves.toMatchObject({
            status: 'missing-language',
            lang: 'or',
            usedNative: true,
            reason: 'This device cannot speak the selected app language',
        })
    })

    it('stops HindTrucks native TTS on Android', () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
        const { result } = renderHook(() => useTTS())

        act(() => {
            result.current.cancel()
        })

        expect(stopNativeTts).toHaveBeenCalled()
    })
})
