import { screen } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import AIChatbot from './AIChatbot'

// Mock speechSynthesis
beforeAll(() => {
    Object.defineProperty(window, 'speechSynthesis', {
        value: {
            speak: vi.fn(),
            cancel: vi.fn(),
            getVoices: () => [],
        },
        writable: true,
    })
})

describe('AIChatbot', () => {
    it('renders the thin wrapper (ChatDrawer)', () => {
        renderWithProviders(<AIChatbot />)
        // ChatDrawer renders a FAB button to open the chat
        expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument()
    })
})