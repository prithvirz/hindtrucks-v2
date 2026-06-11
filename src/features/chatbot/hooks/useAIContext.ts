import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfile } from '../../../state/ProfileContext'
import { useTrip } from '../../../state/TripContext'
import { useEarnings } from '../../../state/EarningsContext'
import { useNotifications } from '../../../hooks/useNotifications'
import { useShell } from '../../../state/ShellContext'
import type { ChatContext } from '../types'

// ─── useAIContext: Aggregate Driver/Load/Trip Context ───
// Collects context from focused contexts for AI personalization.
// Returned object is sent as part of SSE chat request body.

export function useAIContext(): ChatContext {
    const { driver } = useProfile()
    const { activeLoad, tripStep } = useTrip()
    const { walletBalance, payouts } = useEarnings()
    const { unreadCount } = useNotifications()
    const { isOnline } = useShell()
    const { i18n } = useTranslation()

    const recentEarnings = useMemo(() => {
        if (!payouts || payouts.length === 0) return 0
        return payouts
            .filter((p) => p.status === 'credited')
            .reduce((sum, p) => sum + p.amount, 0)
    }, [payouts])

    return useMemo(
        () => ({
            driverName: driver?.name ?? '',
            driverLanguage: i18n.language,
            activeLoadId: activeLoad?.id ?? null,
            tripStep: tripStep ?? 0,
            walletBalance: walletBalance ?? 0,
            recentEarnings,
            unreadNotifications: unreadCount ?? 0,
            isOnline: isOnline ?? true,
        }),
        [driver?.name, i18n.language, activeLoad?.id, tripStep, walletBalance, recentEarnings, unreadCount, isOnline]
    )
}