import type { FaqEntry } from '../features/chatbot/types'

// ─── Static FAQ Keyword Database ───
// Moved from AIChatbot.tsx per Phase 4 refactoring.
// Used by ChatFallback component when API is unavailable or VITE_API_MODE=mock.

export const FAQS_LIST: FaqEntry[] = [
    {
        key: 'withdraw',
        path: '/earnings',
        keywords: [
            'withdraw', 'payout', 'money', 'earning', 'wallet', 'balance', 'payment', 'cash', 'bank', 'pay', 'transferred', 'transfer',
            'निकासी', 'पैसे', 'कमाना', 'कमाई', 'वॉलेट', 'बैंक', 'निकाल', 'paise', 'paisa', 'nikal', 'nikalna', 'kamana', 'kamai', 'earning', 'wallet', 'balance', 'payment', 'cash', 'bank', 'payout', 'pay',
            'பணம்', 'வருமானம்', 'வாலட்', 'எடு', 'panam', 'panam edukka', 'kasu', 'wallet', 'withdrawal', 'money', 'payout', 'bank',
            'విత్‌డ్రా', 'డబ్బు', 'సంపాదన', 'వాలెట్', 'dabbu', 'dabbulu', 'withdraw', 'money', 'wallet', 'payout', 'bank',
            'ਕਮਾਈ', 'ਵਾਲਿਟ', 'ਪੈਸੇ', 'ਨਿਕਾਸੀ', 'paise', 'paisa', 'nikal', 'wallet', 'money', 'withdraw', 'payout', 'bank'
        ]
    },
    {
        key: 'accept',
        path: '/loads',
        keywords: [
            'accept', 'load', 'trip', 'book', 'booking', 'request', 'order', 'gaddi', 'truck', 'find load', 'new trip',
            'लोड', 'ट्रिप', 'स्वीकार', 'बुक', 'गाड़ी', 'गाड़ी', 'load', 'trip', 'book', 'booking', 'gadi', 'gaddi', 'accept', 'swikar', 'swikaar', 'sweekar', 'kaam', 'kam',
            'சரக்கு', 'பயணம்', 'ஏற்க', 'load', 'trip', 'book', 'booking', 'accept', 'vandi',
            'లోడ్', 'ట్రిప్', 'అంగీకరించు', 'load', 'trip', 'book', 'booking', 'accept', 'bandi',
            'ਲੋਡ', 'ਟ੍ਰਿੱਪ', 'ਸਵੀਕਾਰ', 'load', 'trip', 'book', 'booking', 'accept', 'gaddi'
        ]
    },
    {
        key: 'bfc',
        path: '/home',
        keywords: [
            'bfc', 'club', 'leaderboard', 'leader board', 'premium', 'rank', 'elite', 'score', 'points', 'top driver', 'top drivers',
            'लीडरबोर्ड', 'क्लब', 'विशिष्ट', 'रैंक', 'bfc', 'club', 'leaderboard', 'rank', 'elite', 'point', 'points',
            'லீடர்போர்டு', 'கிளப்', 'bfc', 'club', 'leaderboard', 'rank',
            'లీడర్‌బోర్డ్', 'క్లబ్', 'bfc', 'club', 'leaderboard', 'rank',
            'ਲੀਡਰਬੋਰਡ', 'ਕਲੱਬ', 'bfc', 'club', 'leaderboard', 'rank'
        ]
    },
    {
        key: 'refer',
        path: '/home',
        keywords: [
            'refer', 'bonus', 'invite', 'link', 'code', 'share', 'friend', 'referral', '1000', 'reward', 'gift', 'recommend',
            'रेफर', 'लिंक', 'बोनस', 'दोस्त', 'मित्र', 'साझा', 'refer', 'referral', 'invite', 'link', 'bonus', 'dost', 'share', 'code',
            'பரிந்துரை', 'லிங்க்', 'போனஸ்', 'பகிர்', 'நண்பன்', 'refer', 'link', 'bonus', 'invite',
            'రెఫర్', 'లింక్', 'బోనస్', 'షేర్', 'స్నేహితుడు', 'refer', 'link', 'bonus', 'invite',
            'ਰੈਫਰ', 'ਲਿੰਕ', 'ਬੋਨਸ', 'ਸਾਂਝਾ', 'ਦੋਸਤ', 'refer', 'link', 'bonus', 'invite'
        ]
    },
    {
        key: 'docs',
        path: '/profile',
        keywords: [
            'doc', 'license', 'rc', 'permit', 'card', 'document', 'profile', 'paperwork', 'aadhaar', 'pan', 'id proof', 'insurance', 'details',
            'दस्तावेज़', 'कागजात', 'लाइसेंस', 'परमिट', 'कागज़', 'कागज', 'आईडी', 'आरसी', 'फोटो', 'दस्तावेज', 'document', 'documents', 'licence', 'license', 'permit', 'rc', 'profile', 'card', 'kagaj', 'kagaz', 'paper', 'papers',
            'ஆவணம்', 'உரிமம்', 'அனுமதி', 'உரிமப்பத்திரம்', 'லைசென்ஸ்', 'license', 'permit', 'rc', 'profile', 'card', 'documents', 'papers',
            'పత్రాలు', 'లైసెన్స్', 'పర్మిట్', 'లైసెన్సు', 'license', 'permit', 'rc', 'profile', 'card', 'documents', 'papers',
            'ਦਸਤਾਵੇਜ਼', 'ਲਾਇਸੈਂਸ', 'ਪਰਮਿਟ', 'ਕਾਗਜ਼ਾਤ', 'license', 'permit', 'rc', 'profile', 'card', 'documents', 'papers'
        ]
    }
]