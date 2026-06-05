import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { X, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useShell } from '../../../state/ShellContext'
import { useChatContext } from '../../../state/ChatContext'
import { useTTS } from '../hooks/useTTS'
import { useSTT } from '../hooks/useSTT'
import { ChatMessage } from './ChatMessage'

export function PaghriPersonIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Turban/Paghri - Saffron/White premium folds */}
            {/* Top Knot */}
            <path
                d="M44 24 C46 16, 54 16, 56 24 Z"
                fill="#F26A1B"
                stroke="#D05010"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* Main Turban Shape */}
            <path
                d="M25 38 C30 22, 70 22, 75 38 C80 34, 85 44, 75 48 C65 52, 35 52, 25 48 C15 44, 20 34, 25 38 Z"
                fill="#F26A1B"
                stroke="#D05010"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* Folds */}
            <path
                d="M26 37 C38 30, 62 30, 74 37"
                stroke="#FFFFFF"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M28 43 C40 37, 60 37, 72 43"
                stroke="#FFFFFF"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Face/Skin */}
            <path
                d="M33 46 C33 58, 67 58, 67 46"
                fill="#FFE8D6"
                stroke="#E5C5A8"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Premium Aviator Sunglasses */}
            {/* Left Lens */}
            <path
                d="M35 44 C35 41, 46 41, 47 44 L46 49 C44 51, 37 51, 35 49 Z"
                fill="#0B0B0F"
                stroke="#333333"
                strokeWidth="1.2"
            />
            {/* Right Lens */}
            <path
                d="M53 44 C54 41, 65 41, 65 44 L65 49 C63 51, 56 51, 53 49 Z"
                fill="#0B0B0F"
                stroke="#333333"
                strokeWidth="1.2"
            />
            {/* Bridge */}
            <rect x="47" y="44" width="6" height="1.8" fill="#0B0B0F" />

            {/* Mustache */}
            <path
                d="M34 53 C38 50, 45 52, 50 55 C55 52, 62 50, 66 53 C69 55, 71 58, 68 59 C65 60, 61 56, 50 56 C39 56, 35 60, 32 59 C29 58, 31 55, 34 53 Z"
                fill="#3A2A20"
                stroke="#2B1F17"
                strokeWidth="1"
                strokeLinejoin="round"
            />

            {/* Beard */}
            <path
                d="M33 49 C33 66, 67 66, 67 49 C67 56, 61 68, 50 72 C39 68, 33 56, 33 49 Z"
                fill="#3A2A20"
                stroke="#2B1F17"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    )
}


// ─── ChatDrawer: Refactored from AIChatbot.tsx ───
// FAB trigger + slide-up drawer with header, messages, quick questions, and input.

export function ChatDrawer() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { pathname } = useLocation()
    const { isTourActive } = useShell()

    const {
        messages,
        isOpen,
        closeChat,
        toggleChat,
        sendMessage,
    } = useChatContext()
    const hideClosedFab = pathname === '/profile' && !isOpen

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
            {/* Custom Animation Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes paghriFloat {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-3px) rotate(1.5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .animate-paghri-float {
                    animation: paghriFloat 2.5s ease-in-out infinite;
                }
                @keyframes needHelpLoop {
                    0%, 15% {
                        transform: translate(-50%, calc(-50% + 44px)) scale(0);
                        opacity: 0;
                    }
                    30%, 70% {
                        transform: translate(-50%, calc(-50% - 28px)) scale(1);
                        opacity: 1;
                    }
                    85%, 100% {
                        transform: translate(-50%, calc(-50% + 44px)) scale(0);
                        opacity: 0;
                    }
                }
                .animate-need-help {
                    animation: needHelpLoop 6s ease-in-out infinite;
                }
            `}} />

            {/* Centered Proactive Tooltip (Text + Animated Pill) */}
            {!isOpen && (
                <div
                    id="chatbot-button"
                    onClick={toggleChat}
                    className={`absolute left-1/2 -translate-x-1/2 z-40 transition-all duration-500 cursor-pointer select-none bottom-[calc(4.8rem+env(safe-area-inset-bottom))] ${
                        isTourActive || hideClosedFab ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
                    }`}
                >
                    <div className="flex flex-col items-center relative">
                        {/* Animated "Need help?" Pill */}
                        <div className="absolute top-1/2 left-1/2 z-10 pointer-events-none">
                            <div className="bg-accent text-white text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap animate-need-help border border-white/20">
                                {t('bot.need_help', 'Need help?')}
                            </div>
                        </div>

                        {/* Hi, I'm Rahgir. text */}
                        <div className="relative z-0 bg-night-900/95 backdrop-blur-md text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-white/10 shadow-md whitespace-nowrap tracking-wide">
                            {t('bot.hi_im_rahgir', "Hi, I'm Rahgir.")}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Drawer Overlay */}
            {isOpen && (
                <div className="absolute inset-x-0 bottom-0 top-0 z-30 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]"
                        onClick={closeChat}
                    />

                    {/* Drawer Panel */}
                    <div className="relative bg-surface border-t border-hairline h-[510px] flex flex-col animate-fade-up max-w-app w-full mx-auto shadow-pop boxed-rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-surface-sunken text-ink px-4 py-3.5 flex items-center justify-between border-b border-hairline shrink-0 relative z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border-2 border-hairline">
                                    <PaghriPersonIcon className="w-full h-full" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="text-sm font-black leading-tight text-ink">
                                            Raahgir (Driver Assistant)
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
                                    className={`h-8 w-8 flex items-center justify-center rounded-full transition-colors text-ink-muted hover:bg-ink/10 ${!isMuted ? 'text-accent' : 'opacity-60'
                                        }`}
                                    aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
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
                                    aria-label="Close chat"
                                    className="h-8 w-8 flex items-center justify-center hover:bg-ink/10 rounded-full text-ink-muted transition-colors"
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
                            <div className="bg-surface px-3 py-3 border-t border-hairline overflow-x-auto no-scrollbar shrink-0 flex gap-2.5">
                                {activeFaqs.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="shrink-0 text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] border border-accent/20 boxed-rounded px-3.5 py-2 active:scale-95 transition-all duration-100"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Footer Input Box */}
                        <div className="p-3 border-t border-hairline bg-surface shrink-0 flex items-center gap-2">
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
                                className="flex-1 boxed-border boxed-rounded bg-surface-grey px-4 py-2.5 text-sm outline-none font-bold text-ink focus:bg-surface-sunken focus:shadow-md transition-all placeholder:font-semibold placeholder:text-ink-faint disabled:opacity-50"
                            />
                            {hasSpeechSupport && (
                                <button
                                    onClick={toggleListening}
                                    className={`h-10 w-10 flex items-center justify-center boxed-border boxed-rounded transition-all shrink-0 ${isListening
                                        ? 'bg-red-500 text-white animate-pulse border-red-700 shadow-none'
                                        : 'bg-surface hover:bg-surface-sunken text-ink-muted border-hairline shadow-md active:scale-95'
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
