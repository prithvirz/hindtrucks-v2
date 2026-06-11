import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// ── Capacitor mocks (global — every test gets vi.fn() mocks) ─
vi.mock('@capacitor/core', () => ({
    Capacitor: {
        isNativePlatform: vi.fn(() => false),
        getPlatform: vi.fn(() => 'web'),
        isPluginAvailable: vi.fn(() => false),
        addListener: vi.fn(() => ({ remove: vi.fn() })),
    },
    registerPlugin: vi.fn(() => ({})),
    WebPlugin: class { },
    CapacitorException: class extends Error { },
    ExceptionCode: {},
    CapacitorCookies: class { },
    CapacitorHttp: class { },
    WebView: class { },
    buildRequestInit: vi.fn(() => ({})),
}))

vi.mock('@capacitor/app-launcher', () => ({
    AppLauncher: {
        canOpenUrl: vi.fn(async () => ({ value: true })),
        openUrl: vi.fn(async () => ({ completed: true })),
    },
}))

// ── i18n mocks ───────────────────────────────────────────────
vi.mock('i18next', () => {
    // useChat calls i18n.on('added', handler) – must be a real callable function.
    const noop = (..._args: unknown[]) => { }
    return {
        default: {
            use: () => ({
                use: () => ({
                    init: () => Promise.resolve(),
                }),
            }),
            t: (key: string) => key,
            language: 'en',
            changeLanguage: () => Promise.resolve(),
            on: noop,
            off: noop,
            isInitialized: true,
        },
    }
})

vi.mock('react-i18next', () => {
    // Stable references: real react-i18next memoizes `t`/`i18n`, but a fresh
    // object here re-fires every effect that depends on `t` each render —
    // which sends useChat's re-translate effect into an infinite setState loop.
    const t = (key: string) => key
    const noop = (..._args: unknown[]) => { }
    const i18n = {
        language: 'en',
        changeLanguage: () => Promise.resolve(),
        on: noop,
        off: noop,
    }
    return {
        useTranslation: () => ({ t, i18n }),
        Trans: ({ children }: { children: React.ReactNode }) => children,
        initReactI18next: {
            type: '3rdParty',
            init: () => { },
        },
        I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
    }
})

vi.mock('i18next-browser-languagedetector', () => ({
    default: class {
        type = 'languageDetector'
        detect() { return 'en' }
        cacheUserLanguage() { }
        init() { }
    },
}))

// ── Firebase mock ────────────────────────────────────────────
// src/lib/firebase.ts runs initializeApp/getAuth/getFirestore/getStorage at
// module load, and services/index.ts statically imports the real services that
// pull it in — so the real SDK initializes in every test, opening network/IDB
// handles that never close in jsdom and hang the worker on teardown. Stub it.
vi.mock('../lib/firebase', () => ({
    app: {},
    auth: { settings: {}, currentUser: null },
    db: {},
    storage: {},
    messaging: {},
    saveDriverToFirestore: vi.fn(() => Promise.resolve()),
}))

// ── HindTrucks TTS mock ──────────────────────────────────────
vi.mock('../features/chatbot/services/hindTrucksTts', () => ({
    HindTrucksTts: {
        speak: vi.fn(() => Promise.resolve({ status: 'spoken', lang: 'en' })),
        stop: vi.fn(() => Promise.resolve()),
        isLanguageAvailable: vi.fn(() => Promise.resolve({ available: true })),
        getAvailableLanguages: vi.fn(() => Promise.resolve({ languages: [] })),
    },
    speakNativeTts: vi.fn(() => Promise.resolve({ status: 'spoken', lang: 'en' })),
    stopNativeTts: vi.fn(() => Promise.resolve()),
    isNativeTtsLanguageAvailable: vi.fn(() => Promise.resolve({ available: true })),
    getNativeTtsLanguages: vi.fn(() => Promise.resolve({ languages: [] })),
    normalizeTtsLanguage: vi.fn((code: string) => (code || 'en').toLowerCase().replace('_', '-').split('-')[0]),
}))

// ── Browser API mocks ────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

class IntersectionObserverMock {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
})

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

// ── Chat mocks (stop useChat from calling i18n.on) ────────────
vi.mock('../features/chatbot/hooks/useChat', () => ({
    useChat: () => ({
        messages: [],
        isStreaming: false,
        sendMessage: vi.fn(),
        clearChat: vi.fn(),
        retryLast: vi.fn(),
    }),
}))

// ── Sentry mock ───────────────────────────────────────────────
vi.mock('@sentry/react', () => ({
    init: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    browserTracingIntegration: vi.fn(() => ({})),
    replayIntegration: vi.fn(() => ({})),
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../state/ChatContext', () => ({
    ChatProvider: ({ children }: { children: React.ReactNode }) => children,
    useChatContext: vi.fn(() => ({
        isOpen: false,
        isStreaming: false,
        openChat: vi.fn(),
        closeChat: vi.fn(),
        toggleChat: vi.fn(),
        messages: [],
        sendMessage: vi.fn(),
        clearChat: vi.fn(),
        retryLast: vi.fn(),
    })),
}))

// ── Cleanup ──────────────────────────────────────────────────
afterEach(() => {
    cleanup()
})