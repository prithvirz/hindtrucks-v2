import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// ── i18n mocks ───────────────────────────────────────────────
vi.mock('i18next', () => ({
    default: {
        use: () => ({
            use: () => ({
                init: () => Promise.resolve(),
            }),
        }),
        t: (key: string) => key,
        language: 'en',
        changeLanguage: () => Promise.resolve(),
        on: () => { },
        off: () => { },
        isInitialized: true,
    },
}))

vi.mock('react-i18next', () => {
    // Stable references: real react-i18next memoizes `t`/`i18n`, but a fresh
    // object here re-fires every effect that depends on `t` each render —
    // which sends useChat's re-translate effect into an infinite setState loop.
    const t = (key: string) => key
    const i18n = {
        language: 'en',
        changeLanguage: () => Promise.resolve(),
        on: () => { },
        off: () => { },
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
    saveDriverToFirestore: vi.fn(() => Promise.resolve()),
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

// ── Cleanup ──────────────────────────────────────────────────
afterEach(() => {
    cleanup()
})