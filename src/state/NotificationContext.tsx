// ─── NotificationProvider: Central Push Notification State ───

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useNotificationPermission } from '../features/notifications/hooks/useNotificationPermission'
import { useFcmToken } from '../features/notifications/hooks/useFcmToken'
import { useForegroundMessages } from '../features/notifications/hooks/useForegroundMessages'
import {
    getStoredNotifications,
    markNotificationRead,
    deleteStoredNotification,
} from '../features/notifications/services/notificationService'
import { notificationsService } from '../services'
import type { PushNotification, NotificationPermissionState } from '../features/notifications/types'

export interface NotificationContextValue {
    // Permission
    permissionState: NotificationPermissionState
    isPermissionGranted: boolean
    isPermissionDenied: boolean
    requestPermission: () => Promise<boolean>

    // FCM Token
    fcmToken: string | null
    isTokenLoading: boolean

    // Notifications
    notifications: PushNotification[]
    unreadCount: number
    activeBanner: PushNotification | null

    // Actions
    markRead: (id: string) => Promise<void>
    markAllRead: () => Promise<void>
    deleteNotification: (id: string) => Promise<void>
    dismissBanner: () => void
    refreshHistory: () => Promise<void>
}

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { phone } = useAuth()
    const {
        permissionState,
        isGranted: isPermissionGranted,
        isDenied: isPermissionDenied,
        requestPermission,
    } = useNotificationPermission()
    const { token: fcmToken, isLoading: isTokenLoading } = useFcmToken(phone)
    const { activeBanner, dismissBanner } = useForegroundMessages()

    const [notifications, setNotifications] = useState<PushNotification[]>([])

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications],
    )

    // Load stored notifications on mount
    useEffect(() => {
        getStoredNotifications().then(setNotifications).catch(() => { })
    }, [])

    // Reload when a foreground message arrives (stored in IndexedDB by useForegroundMessages)
    useEffect(() => {
        if (activeBanner) {
            getStoredNotifications().then(setNotifications).catch(() => { })
        }
    }, [activeBanner])

    const markRead = useCallback(async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        )
        await markNotificationRead(id).catch(() => { })
        notificationsService.markRead(id).catch(() => { })
    }, [])

    const markAllRead = useCallback(async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        // Mark all stored notifications read in IndexedDB
        await getStoredNotifications().then((stored) => {
            stored.forEach((n) => markNotificationRead(n.id))
        }).catch(() => { })
        notificationsService.markAllRead().catch(() => { })
    }, [])

    const deleteNotification = useCallback(async (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        await deleteStoredNotification(id).catch(() => { })
    }, [])

    const refreshHistory = useCallback(async () => {
        try {
            const page = await notificationsService.getHistory(1, 50)
            const local = await getStoredNotifications()
            // Merge: server items take precedence, dedupe by id
            const serverIds = new Set(page.items.map((n) => n.id))
            const merged: PushNotification[] = [
                ...(page.items as PushNotification[]),
                ...local.filter((n) => !serverIds.has(n.id)),
            ]
            setNotifications(merged)
        } catch {
            // Fallback to local IndexedDB
            const local = await getStoredNotifications()
            setNotifications(local)
        }
    }, [])

    const value = useMemo<NotificationContextValue>(
        () => ({
            permissionState,
            isPermissionGranted,
            isPermissionDenied,
            requestPermission,
            fcmToken,
            isTokenLoading,
            notifications,
            unreadCount,
            activeBanner,
            markRead,
            markAllRead,
            deleteNotification,
            dismissBanner,
            refreshHistory,
        }),
        [
            permissionState,
            isPermissionGranted,
            isPermissionDenied,
            requestPermission,
            fcmToken,
            isTokenLoading,
            notifications,
            unreadCount,
            activeBanner,
            markRead,
            markAllRead,
            deleteNotification,
            dismissBanner,
            refreshHistory,
        ],
    )

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}