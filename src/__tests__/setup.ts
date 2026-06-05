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

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: () => Promise.resolve(),
            on: () => { },
            off: () => { },
        },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: {
        type: '3rdParty',
        init: () => { },
    },
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('i18next-browser-languagedetector', () => ({
    default: class {
        type = 'languageDetector'
        detect() { return 'en' }
        cacheUserLanguage() { }
        init() { }
    },
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