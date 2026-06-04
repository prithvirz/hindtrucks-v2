import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send, Bot, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useShell } from '../../../state/ShellContext'
import { useChatContext } from '../../../state/ChatContext'
import { useTTS } from '../hooks/useTTS'
import { useSTT } from '../hooks/useSTT'
import { ChatMessage } from './ChatMessage'

// ─── ChatDrawer: Refactored from AIChatbot.tsx ───
// FAB trigger + slide-up drawer with header, messages, quick questions, and input.

export function ChatDrawer() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { isTourActive } = useShell()

    const {
        messages,
        isOpen,
        closeChat,
        toggleChat,
        sendMessage,
    } = useChatContext()

    // Auto scroll to bottom when new messages arrive or when chat is opened
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages, isOpen])
    const { t } = useTranslation()
    const { speak, cancel: cancelTts } = useTTS()

    const [inputValue, setInputValue] = useState('')
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('ht_bot_muted') === 'true'
    })

    // STT hook
    const handleSttResult = (text: string) => {
        setInputValue(text)
    }
    const { isListening, hasSpeechSupport, toggleListening } =
        useSTT(handleSttResult)

    const placeholderText = isListening
        ? t('bot.listening')
        : t('bot.placeholder')

    // FAQ questions from i18n
    const faqKeys = ['withdraw', 'accept', 'bfc', 'refer', 'docs']
    const activeFaqs = faqKeys.map((k) => t(`bot.faq_${k}_q`))

    // Persist mute choice
    useEffect(() => {
        localStorage.setItem('ht_bot_muted', String(isMuted))
        if (isMuted) cancelTts()
    }, [isMuted, cancelTts])

    // Cancel TTS/STT when closing
    useEffect(() => {
        if (!isOpen) {
            cancelTts()
        }
    }, [isOpen, cancelTts])

    function handleSend(text: string) {
        if (!text.trim()) return
        sendMessage(text)
        setInputValue('')
    }

    function handleQuickQuestion(qText: string) {
        handleSend(qText)
    }

    function handlePlayTts(text: string, lang: string) {
        if (!isMuted) {
            speak(text, lang)
        }
    }

    return (
        <div className="chatbot-container">
            {/* Floating Action Button */}
            <button
                id="chatbot-button"
                onClick={toggleChat}
                className={`absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 h-12 w-12 flex items-center justify-center bg-accent text-white boxed-border boxed-shadow-accent boxed-rounded boxed-btn-active transition-all ${isTourActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                aria-label="AI Chatbot Assistant"
            >
                {isOpen ? (
                    <X size={22} strokeWidth={2.5} />
                ) : (
                    <Bot size={24} strokeWidth={2.5} />
                )}
            </button>

            {/* Chat Drawer Overlay */}
            {isOpen && (
                <div className="absolute inset-x-0 bottom-0 top-0 z-30 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]"
                        onClick={closeChat}
                    />

                    {/* Drawer Panel */}
                    <div className="relative bg-surface border-t-2 border-ink h-[510px] flex flex-col animate-fade-up max-w-app w-full mx-auto shadow-pop boxed-rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-ink text-white px-4 py-3.5 flex items-center justify-between border-b-2 border-ink shrink-0 relative">
                            <div className="flex items-center gap-2">
                                <div className="h-8.5 w-8.5 rounded bg-accent flex items-center justify-center boxed-border">
                                    <Bot size={18} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-sm font-black leading-tight text-white">
                                            HindTrucks AI Support
                                        </h3>
                                        <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
                                    </div>
                                    <span className="text-[10px] text-accent font-extrabold uppercase tracking-wide">
                                        Online Assistant
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors text-white hover:bg-white/10 ${!isMuted ? 'text-accent' : 'opacity-60'
                                        }`}
                                    title={isMuted ? 'Unmute voice' : 'Mute voice'}
                                >
                                    {isMuted ? (
                                        <VolumeX size={18} strokeWidth={2.5} />
                                    ) : (
                                        <Volume2 size={18} strokeWidth={2.5} />
                                    )}
                                </button>
                                <button
                                    onClick={closeChat}
                                    className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-colors"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Body Messages */}
                        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-grey no-scrollbar">
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    ttsEnabled={!isMuted}
                                    onPlayTts={handlePlayTts}
                                />
                            ))}
                        </div>

                        {/* Quick pre-defined questions */}
                        {activeFaqs.length > 0 && (
                            <div className="bg-white px-3 py-3 border-t border-hairline overflow-x-auto no-scrollbar shrink-0 flex gap-2.5">
                                {activeFaqs.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="shrink-0 text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] boxed-border border-accent boxed-rounded px-3.5 py-2 shadow-[2px_2px_0px_0px_#F26A1B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Footer Input Box */}
                        <div className="p-3 border-t-2 border-ink bg-white shrink-0 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder={placeholderText}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSend(inputValue)
                                        setInputValue('')
                                    }
                                }}
                                disabled={isListening}
                                className="flex-1 boxed-border boxed-rounded bg-surface-grey px-4 py-2.5 text-sm outline-none font-bold text-ink focus:bg-white focus:shadow-[2px_2px_0px_0px_#0B0B0F] transition-all placeholder:font-semibold placeholder:text-ink-faint disabled:opacity-50"
                            />
                            {hasSpeechSupport && (
                                <button
                                    onClick={toggleListening}
                                    className={`h-10 w-10 flex items-center justify-center boxed-border boxed-rounded transition-all shrink-0 ${isListening
                                        ? 'bg-red-500 text-white animate-pulse border-red-700 shadow-none'
                                        : 'bg-surface hover:bg-surface-grey text-ink border-ink shadow-[2px_2px_0px_0px_#0B0B0F] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                                        }`}
                                    title="Speak Message"
                                >
                                    {isListening ? (
                                        <MicOff size={16} strokeWidth={2.5} />
                                    ) : (
                                        <Mic size={16} strokeWidth={2.5} />
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    handleSend(inputValue)
                                    setInputValue('')
                                }}
                                disabled={isListening}
                                className="h-10 w-10 bg-accent text-white flex items-center justify-center boxed-border boxed-rounded boxed-btn-active transition-all shrink-0 disabled:opacity-50"
                            >
                                <Send size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}