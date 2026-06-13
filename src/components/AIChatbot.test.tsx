import { screen, fireEvent, waitFor, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AIChatbot from './AIChatbot'
import type { ChatMessage } from '../features/chatbot/types'

const closeChat = vi.fn()
const toggleChat = vi.fn()
const sendMessage = vi.fn()

let isOpen = false
let messages: ChatMessage[] = []

vi.mock('../state/ShellContext', () => ({
    useShell: () => ({
        isTourActive: false,
    }),
}))

vi.mock('../state/ChatContext', () => ({
    useChatContext: () => ({
        messages,
        isOpen,
        isStreaming: false,
        openChat: vi.fn(),
        closeChat,
        toggleChat,
        sendMessage,
        clearChat: vi.fn(),
        retryLast: vi.fn(),
    }),
}))

function renderChatbot() {
    return render(
        <MemoryRouter>
            <AIChatbot />
        </MemoryRouter>
    )
}

beforeAll(() => {
    Object.defineProperty(window, 'speechSynthesis', {
        value: {
            speak: vi.fn(),
            cancel: vi.fn(),
            getVoices: () => [],
        },
        writable: true,
    })

    window.HTMLElement.prototype.scrollTo = vi.fn()
})

describe('AIChatbot', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        isOpen = false
        messages = []
    })

    it('renders the closed Raahgir launcher', () => {
        renderChatbot()

        expect(screen.getByText('bot.hi_im_rahgir')).toBeInTheDocument()
    })

    it('opens the chat drawer through the launcher', () => {
        renderChatbot()

        fireEvent.click(screen.getByText('bot.hi_im_rahgir'))

        expect(toggleChat).toHaveBeenCalledTimes(1)
    })

    it('renders open drawer messages and scrolls to bottom', async () => {
        const scrollToSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollTo')
        isOpen = true
        messages = [
            {
                id: 'welcome',
                role: 'assistant',
                content: 'Welcome driver',
                language: 'en',
                timestamp: 1,
            },
        ]

        renderChatbot()

        expect(screen.getByText('Raahgir (Driver Assistant)')).toBeInTheDocument()
        expect(screen.getByText('Welcome driver')).toBeInTheDocument()
        await waitFor(() => expect(scrollToSpy).toHaveBeenCalled())
    })

    it('sends a quick question', () => {
        isOpen = true

        renderChatbot()

        fireEvent.click(screen.getByRole('button', { name: 'bot.faq_withdraw_q' }))

        expect(sendMessage).toHaveBeenCalledWith('bot.faq_withdraw_q')
    })

    it('closes the chat drawer', () => {
        isOpen = true

        renderChatbot()

        fireEvent.click(screen.getByRole('button', { name: /close chat/i }))

        expect(closeChat).toHaveBeenCalledTimes(1)
    })
})
