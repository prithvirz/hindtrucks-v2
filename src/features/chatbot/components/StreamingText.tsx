// ─── StreamingText: Animated Typewriter Effect ───
// Driven by content prop updates. Shows blinking cursor while streaming.
// Used by ChatMessage for assistant messages during SSE streaming.

interface StreamingTextProps {
    text: string
    isStreaming?: boolean
}

export function StreamingText({ text, isStreaming = false }: StreamingTextProps) {
    return (
        <span className="leading-relaxed whitespace-pre-wrap break-words">
            {text}
            {isStreaming && (
                <span className="inline-block w-[3px] h-[1em] bg-accent ml-0.5 align-text-bottom animate-blink" />
            )}
        </span>
    )
}