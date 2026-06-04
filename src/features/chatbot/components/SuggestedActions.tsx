import { useNavigate } from 'react-router-dom'
import type { SuggestedAction } from '../types'
import { useChatContext } from '../../../state/ChatContext'

// ─── SuggestedActions: Tappable Action Chips ───
// Enhanced replacement for RedirectBubble. Supports navigation,
// trip actions, and call_support payloads.

interface SuggestedActionsProps {
    actions: SuggestedAction[]
    onAction?: (action: SuggestedAction) => void
}

export function SuggestedActions({ actions, onAction }: SuggestedActionsProps) {
    const nav = useNavigate()
    const { closeChat } = useChatContext()

    function handleAction(action: SuggestedAction) {
        if (onAction) {
            onAction(action)
            return
        }

        switch (action.action) {
            case 'navigate':
                if (action.payload?.route) {
                    nav(action.payload.route)
                    closeChat()
                }
                break
            case 'accept_load':
            case 'view_load':
                nav('/loads')
                closeChat()
                break
            case 'start_trip':
                nav('/trip')
                closeChat()
                break
            case 'view_earnings':
                nav('/earnings')
                closeChat()
                break
            case 'update_profile':
                nav('/profile')
                closeChat()
                break
            case 'call_support':
                if (action.payload?.phoneNumber) {
                    window.location.href = `tel:${action.payload.phoneNumber}`
                }
                break
        }
    }

    if (!actions || actions.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mt-2.5 pt-2 border-t border-ink/10">
            {actions.map((action) => (
                <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    className="text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] boxed-border border-accent boxed-rounded px-3 py-1.5 shadow-[2px_2px_0px_0px_#F26A1B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
                >
                    {action.label}
                </button>
            ))}
        </div>
    )
}