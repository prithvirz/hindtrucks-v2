// ─── FCM Token Lifecycle Hook ───

import { useState, useCallback, useEffect, useRef } from 'react'
import { getToken, onRegistered, deleteToken as deleteFcmToken } from 'firebase/messaging'
import { messaging } from '../../../lib/firebase'
import { notificationsService } from '../../../services'
import type { UseFcmTokenReturn } from './useFcmToken.types'
import { useNotificationPermission } from './useNotificationPermission'

export function useFcmToken(driverId: string | null): UseFcmTokenReturn {
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem('fcm_token'),
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { isGranted } = useNotificationPermission()
    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const registerWithServer = useCallback(
        async (t: string) => {
            if (!driverId) return
            try {
                await notificationsService.registerToken(t)
                await notificationsService.subscribeToTopic(`driver_${driverId}`)
            } catch {
                // Server registration failed — token stays in localStorage for retry
            }
        },
        [driverId],
    )

    const fetchToken = useCallback(async (): Promise<string | null> => {
        if (!isGranted) return null

        setIsLoading(true)
        setError(null)

        try {
            const t = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
            })
            if (t) {
                setToken(t)
                localStorage.setItem('fcm_token', t)
                await registerWithServer(t)
                return t
            }
            return null
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to get FCM token'
            setError(msg)
            // Retry after 30s
            if (retryTimer.current) clearTimeout(retryTimer.current)
            retryTimer.current = setTimeout(() => {
                fetchToken()
            }, 30_000)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [isGranted, registerWithServer])

    const removeToken = useCallback(async () => {
        try {
            if (token) {
                await notificationsService.unregisterToken(token)
            }
            await deleteFcmToken(messaging)
        } catch {
            // Best effort cleanup
        }
        setToken(null)
        localStorage.removeItem('fcm_token')
        if (retryTimer.current) {
            clearTimeout(retryTimer.current)
            retryTimer.current = null
        }
    }, [token])

    // Fetch token when permission is granted or driverId changes
    useEffect(() => {
        if (isGranted && driverId) {
            // Only fetch if token not already in state
            if (!token) {
                fetchToken()
            }
        }
    }, [isGranted, driverId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for token rotation via FID re-registration
    useEffect(() => {
        if (!isGranted) return

        const unsubscribe = onRegistered(messaging, (newToken: string) => {
            setToken(newToken)
            localStorage.setItem('fcm_token', newToken)
            registerWithServer(newToken)
        })

        return () => {
            unsubscribe()
        }
    }, [isGranted, registerWithServer])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimer.current) {
                clearTimeout(retryTimer.current)
            }
        }
    }, [])

    return {
        token,
        isLoading,
        error,
        getToken: fetchToken,
        deleteToken: removeToken,
        isPermissionGranted: isGranted,
    }
}