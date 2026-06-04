import type {
    IChatService,
    SendMessageRequest,
    SendMessageResponse,
    ChatMessage,
} from '../types'

const delay = () => new Promise<void>((r) => setTimeout(r, 300 + Math.random() * 500))

// Static FAQ matching logic (mirrors AIChatbot's faqsList)
interface FaqEntry {
    key: string
    path: string
    keywords: string[]
}

const faqsList: FaqEntry[] = [
    {
        key: 'withdraw',
        path: '/earnings',
        keywords: [
            'withdraw', 'payout', 'money', 'earning', 'wallet', 'balance', 'payment', 'cash', 'bank', 'pay', 'transferred', 'transfer',
        ],
    },
    {
        key: 'accept',
        path: '/loads',
        keywords: [
            'accept', 'load', 'trip', 'book', 'booking', 'request', 'order', 'truck', 'find load', 'new trip',
        ],
    },
    {
        key: 'bfc',
        path: '/home',
        keywords: [
            'bfc', 'club', 'leaderboard', 'leader board', 'premium', 'rank', 'elite', 'score', 'points', 'top driver', 'top drivers',
        ],
    },
    {
        key: 'refer',
        path: '/home',
        keywords: [
            'refer', 'bonus', 'invite', 'link', 'code', 'share', 'friend', 'referral', '1000', 'reward', 'gift', 'recommend',
        ],
    },
    {
        key: 'docs',
        path: '/profile',
        keywords: [
            'doc', 'document', 'license', 'rc', 'permit', 'card', 'profile', 'paperwork', 'aadhaar', 'pan', 'id proof', 'insurance', 'details',
        ],
    },
]

const faqResponses: Record<string, string> = {
    withdraw: 'Your earnings and wallet balance are available on the Earnings screen. You can withdraw money directly to your UPI ID. Tap "Go Now" to visit the Earnings page.',
    accept: 'You can find and accept new loads from the Loads screen. Browse available loads and tap "Accept" to start a new trip. Tap "Go Now" to view loads.',
    bfc: 'BFC (Best Fleet Club) is our premium driver program. Check your ranking, earn points, and unlock exclusive rewards on the Home screen.',
    refer: 'Invite fellow drivers and earn ₹1,000 bonus for each successful referral! Find your referral code on the Home screen.',
    docs: 'Your documents (license, RC, permit) are stored securely in your Profile. You can view and manage them anytime from the Profile screen.',
}

const fallbackResponse = "I can help you with loads, earnings, documents, BFC club, and referrals. Please ask me about any of these topics, and I'll guide you to the right screen!"

export const mockChatService: IChatService = {
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
        await delay()

        const normalizedInput = request.message.toLowerCase().trim()
        const conversationId = request.conversationId ?? `conv_${Date.now()}`

        // Find matching FAQ
        let matchedFaq: FaqEntry | null = null
        for (const faq of faqsList) {
            const found = faq.keywords.some((kw) => normalizedInput.includes(kw.toLowerCase()))
            if (found) {
                matchedFaq = faq
                break
            }
        }

        const replyId = `reply_${Date.now()}`
        let reply: ChatMessage

        if (matchedFaq) {
            reply = {
                id: replyId,
                sender: 'bot',
                text: faqResponses[matchedFaq.key] ?? fallbackResponse,
                redirectPath: matchedFaq.path,
                redirectMsg: `Go to ${matchedFaq.path.replace('/', '')}`,
            }
            return {
                reply,
                conversationId,
                suggestedActions: ['Go Now'],
            }
        }

        reply = {
            id: replyId,
            sender: 'bot',
            text: fallbackResponse,
        }

        return {
            reply,
            conversationId,
            suggestedActions: ['Loads', 'Earnings', 'Profile', 'Home'],
        }
    },
}