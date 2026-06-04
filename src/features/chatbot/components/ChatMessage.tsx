import type { ChatMessage as ChatMessageType } from '../types'
import { StreamingText } from './StreamingText'
import { SuggestedActions } from './SuggestedActions'
import { Volume2 } from 'lucide-react'

// ─── ChatMessage: User/Assistant Bubble ───

interface ChatMessageProps {
    message: ChatMessageType
    ttsEnabled?: boolean
    onPlayTts?: (text: string, lang: string) => void
}

export function ChatMessage({ message, ttsEnabled = false, onPlayTts }: ChatMessageProps) {
    const isBot = message.role === 'assistant'

    return (
        <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
            <div
                className={`max-w-[80%] px-4 py-3 text-[14px] leading-relaxed boxed-border boxed-rounded shadow-[2px_2px_0px_0px_#0B0B0F] ${isBot
                        ? 'bg-white text-ink font-semibold w-full'
                        : 'bg-gradient-to-br from-accent to-[#E0590E] text-white font-bold'
                    }`}
            >
                {message.isStreaming && !message.content ? (
                    <div className="flex gap-1.5 py-1.5 items-center">
                        <span className="h-2 w-2 rounded-full bg-accent animate-bounce" />
                        <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                    </div>
                ) : (
                    <StreamingText
                        text={message.content}
                        isStreaming={message.isStreaming}
                    />
                )}

                {message.suggestedActions && message.suggestedActions.length > 0 && !message.isStreaming && (
                    <SuggestedActions actions={message.suggestedActions} />
                )}

                {isBot && !message.isStreaming && message.content && ttsEnabled && onPlayTts && (
                    <button
                        onClick={() => onPlayTts(message.content, message.language)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-ink-faint hover:text-accent transition-colors"
                        title="Listen"
                    >
                        <Volume2 size={12} strokeWidth={2.5} />
                        <span className="font-extrabold uppercase tracking-wide">Listen</span>
                    </button>
                )}

                {message.isError && (
                    <div className="mt-1.5 text-[10px] text-red-500 font-extrabold uppercase tracking-wide">
                        Connection issue — showing offline response
                    </div>
                )}
            </div>
        </div>
    )
}