import { screen, fireEvent, waitFor } from '@testing-library/react'
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

    // Mock scrollTo on HTMLElement
    window.HTMLElement.prototype.scrollTo = vi.fn()
})

describe('AIChatbot', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the thin wrapper (ChatDrawer)', () => {
        renderWithProviders(<AIChatbot />)
        // ChatDrawer renders a FAB button to open the chat
        expect(screen.getByRole('button', { name: /assistant/i })).toBeInTheDocument()
    })

    it('opens the chat drawer and scrolls to bottom', async () => {
        const scrollToSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollTo')
        renderWithProviders(<AIChatbot />)

        const fab = screen.getByRole('button', { name: /assistant/i })
        fireEvent.click(fab)

        await waitFor(() => {
            expect(screen.getByText('HindTrucks AI Support')).toBeInTheDocument()
        })

        // Check if scrollTo was called on the messages container
        expect(scrollToSpy).toHaveBeenCalled()
    })

    it('minimizes the chat drawer when clicking on a suggested action chip', async () => {
        renderWithProviders(<AIChatbot />)

        // Open chat drawer
        const fab = screen.getByRole('button', { name: /assistant/i })
        fireEvent.click(fab)

        // Click the quick question button that triggers the suggested action
        let quickBtn: HTMLElement | null = null
        await waitFor(() => {
            quickBtn = screen.getByRole('button', { name: 'bot.faq_withdraw_q' })
            expect(quickBtn).toBeInTheDocument()
        })
        if (quickBtn) {
            fireEvent.click(quickBtn)
        }

        // Check if suggested action is shown (which uses translation key bot.faq_withdraw_redirect)
        let actionButton: HTMLElement | null = null
        await waitFor(() => {
            actionButton = screen.getByText('bot.faq_withdraw_redirect')
            expect(actionButton).toBeInTheDocument()
        })

        // Click the suggested action link
        if (actionButton) {
            fireEvent.click(actionButton)
        }

        // Chat drawer should minimize (HindTrucks AI Support should not be in document)
        await waitFor(() => {
            expect(screen.queryByText('HindTrucks AI Support')).not.toBeInTheDocument()
        })
    })
})