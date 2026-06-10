import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../__tests__/test-utils'
import AIChatbot from './AIChatbot'
import BottomTabBar from './BottomTabBar'

// Override global ChatContext mock with stateful implementation using real React state,
// so that toggleChat / closeChat / openChat actually change isOpen and trigger re-renders.
vi.mock('../state/ChatContext', async () => {
    const React = await import('react')
    const { createContext, useContext } = React

    interface ChatValue {
        isOpen: boolean
        isStreaming: boolean
        openChat: () => void
        closeChat: () => void
        toggleChat: () => void
        messages: never[]
        sendMessage: ReturnType<typeof vi.fn>
        clearChat: ReturnType<typeof vi.fn>
        retryLast: ReturnType<typeof vi.fn>
    }

    const ChatCtx = createContext<ChatValue | null>(null)

    function ChatProvider({ children }: { children: React.ReactNode }) {
        const [isOpen, setIsOpen] = React.useState(false)
        const value: ChatValue = {
            isOpen,
            isStreaming: false,
            openChat: () => setIsOpen(true),
            closeChat: () => setIsOpen(false),
            toggleChat: () => setIsOpen((prev: boolean) => !prev),
            messages: [],
            sendMessage: vi.fn(),
            clearChat: vi.fn(),
            retryLast: vi.fn(),
        }
        return React.createElement(ChatCtx.Provider, { value }, children)
    }

    return {
        ChatProvider,
        useChatContext: () => {
            const ctx = useContext(ChatCtx)
            if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
            return ctx
        },
    }
})

// Mock speechSynthesis (not available in jsdom)
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
        renderWithProviders(
            <>
                <AIChatbot />
                <BottomTabBar />
            </>
        )
        // ChatDrawer triggers via BottomTabBar button
        expect(screen.getByRole('button', { name: /assistant/i })).toBeInTheDocument()
    })

    it('opens the chat drawer and scrolls to bottom', async () => {
        const scrollToSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollTo')
        renderWithProviders(
            <>
                <AIChatbot />
                <BottomTabBar />
            </>
        )

        // Chat drawer starts closed
        expect(screen.queryByText('Raahgir (Driver Assistant)')).not.toBeInTheDocument()

        // Click the Raahgir FAB to open
        const fab = screen.getByRole('button', { name: /assistant/i })
        fireEvent.click(fab)

        await waitFor(() => {
            expect(screen.getByText('Raahgir (Driver Assistant)')).toBeInTheDocument()
        })

        // Auto-scroll should have been triggered when drawer opened
        expect(scrollToSpy).toHaveBeenCalled()
    })

    it('minimizes the chat drawer when clicking the close button', async () => {
        renderWithProviders(
            <>
                <AIChatbot />
                <BottomTabBar />
            </>
        )

        // Open chat drawer via FAB
        const fab = screen.getByRole('button', { name: /assistant/i })
        fireEvent.click(fab)

        await waitFor(() => {
            expect(screen.getByText('Raahgir (Driver Assistant)')).toBeInTheDocument()
        })

        // Click the close (X) button
        const closeButton = screen.getByRole('button', { name: 'Close chat' })
        fireEvent.click(closeButton)

        // Chat drawer should minimize
        await waitFor(() => {
            expect(screen.queryByText('Raahgir (Driver Assistant)')).not.toBeInTheDocument()
        })
    })
})