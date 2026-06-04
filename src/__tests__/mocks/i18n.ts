import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
}))