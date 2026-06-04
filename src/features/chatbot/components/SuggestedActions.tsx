import { useNavigate } from 'react-router-dom'
import { ExternalLink, ArrowRight, Phone } from 'lucide-react'
import type { SuggestedAction } from '../types'
import { useChatContext } from '../../../state/ChatContext'

// ─── SuggestedActions: "Tap to open" CTA Chips ───
// Renders tappable action buttons with a clear call-to-action style.

interface SuggestedActionsProps {
    actions: SuggestedAction[]
    onAction?: (action: SuggestedAction) => void
}

function getActionIcon(action: SuggestedAction) {
    if (action.action === 'call_support') return Phone
    if (action.action === 'navigate' || action.action === 'update_profile') return ExternalLink
    return ArrowRight
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
        <div className="flex flex-col gap-2 mt-3">
            {actions.map((action) => {
                const Icon = getActionIcon(action)
                return (
                    <button
                        key={action.id}
                        onClick={() => handleAction(action)}
                        className="group flex items-center justify-between w-full gap-2 px-3.5 py-2.5 text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] active:bg-[#ffd9bc] boxed-border border-accent boxed-rounded shadow-[2px_2px_0px_0px_#F26A1B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
                    >
                        <span className="flex items-center gap-1.5">
                            <Icon size={13} strokeWidth={2.8} className="shrink-0" />
                            <span>{action.label}</span>
                        </span>
                        <ArrowRight
                            size={13}
                            strokeWidth={2.8}
                            className="shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform duration-100"
                        />
                    </button>
                )
            })}
        </div>
    )
}