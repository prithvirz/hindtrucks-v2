// ─── Foreground Message Handler ───

import { useState, useEffect, useCallback, useRef } from 'react'
import { onMessage, type MessagePayload } from 'firebase/messaging'
import { messaging } from '../../../lib/firebase'
import type { PushNotification, NotificationType } from '../types'
import { storeNotification } from '../services/notificationService'

interface UseForegroundMessagesReturn {
    activeBanner: PushNotification | null
    dismissBanner: () => void
}

function normalizeFcmMessage(payload: MessagePayload): PushNotification {
    return {
        id: payload.data?.notificationId || crypto.randomUUID(),
        type: (payload.data?.type as NotificationType) || 'announcement',
        title: payload.notification?.title || payload.data?.title || 'HindTrucks',
        body: payload.notification?.body || payload.data?.body || '',
        deepLink: payload.data?.deepLink || '/home',
        read: false,
        receivedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }
}

export function useForegroundMessages(): UseForegroundMessagesReturn {
    const [activeBanner, setActiveBanner] = useState<PushNotification | null>(null)
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearBanner = useCallback(() => {
        setActiveBanner(null)
        if (dismissTimer.current) {
            clearTimeout(dismissTimer.current)
            dismissTimer.current = null
        }
    }, [])

    const dismissBanner = useCallback(() => {
        clearBanner()
    }, [clearBanner])

    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
            const notification = normalizeFcmMessage(payload)

            // Persist to IndexedDB
            storeNotification(notification).catch(() => {
                // Non-blocking — banner still shown
            })

            // Show banner
            setActiveBanner(notification)

            // Auto-dismiss after 8s
            if (dismissTimer.current) clearTimeout(dismissTimer.current)
            dismissTimer.current = setTimeout(() => {
                setActiveBanner(null)
            }, 8_000)
        })

        return () => {
            unsubscribe()
            if (dismissTimer.current) {
                clearTimeout(dismissTimer.current)
            }
        }
    }, [])

    // Listen for NOTIFICATION_CLICKED from SW (background notification tapped)
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'NOTIFICATION_CLICKED') {
                // Navigation handled by NotificationProvider — here we just clear banner
                clearBanner()
            }
        }
        navigator.serviceWorker?.addEventListener('message', handler)
        return () => {
            navigator.serviceWorker?.removeEventListener('message', handler)
        }
    }, [clearBanner])

    return { activeBanner, dismissBanner }
}