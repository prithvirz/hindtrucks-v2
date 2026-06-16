// ─── Push Notifications Hook: Full Subscription Lifecycle ───

import { useState, useCallback, useEffect } from 'react';
import type { PushNotification } from '../types';
import {
    subscribeToPush,
    unsubscribeFromPush,
    fetchNotificationHistory,
    getStoredNotifications,
    markNotificationRead,
    deleteStoredNotification,
} from '../services/notificationService';
import { useNotificationPermission } from './useNotificationPermission';

interface UsePushNotificationsReturn {
    permissionState: ReturnType<typeof useNotificationPermission>['permissionState'];
    isSubscribed: boolean;
    subscribe: () => Promise<boolean>;
    /** Persist that the prompt was shown/declined so it respects the cooldown. */
    dismissPermissionPrompt: () => void;
    unsubscribe: () => Promise<void>;
    notifications: PushNotification[];
    unreadCount: number;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refreshHistory: () => Promise<void>;
    showBanner: (notification: PushNotification) => void;
    activeBanner: PushNotification | null;
    dismissBanner: () => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const { permissionState, markPrompted, checkPermission } = useNotificationPermission();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [notifications, setNotifications] = useState<PushNotification[]>([]);
    const [activeBanner, setActiveBanner] = useState<PushNotification | null>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const loadStoredNotifications = useCallback(async () => {
        try {
            const stored = await getStoredNotifications();
            setNotifications((prev) => {
                const existingIds = new Set(prev.map((n) => n.id));
                const newItems = stored.filter((n) => !existingIds.has(n.id));
                if (newItems.length === 0) return prev;
                return [...prev, ...newItems];
            });
        } catch {
            // Silently fail — stored notifications are non-critical
        }
    }, []);

    const refreshHistory = useCallback(async () => {
        const [serverNotifications, storedNotifications] = await Promise.all([
            fetchNotificationHistory().catch(() => [] as PushNotification[]),
            getStoredNotifications().catch(() => [] as PushNotification[]),
        ]);

        const merged = new Map<string, PushNotification>();
        for (const n of storedNotifications) merged.set(n.id, n);
        for (const n of serverNotifications) merged.set(n.id, n);

        setNotifications(
            Array.from(merged.values()).sort((a, b) => b.receivedAt - a.receivedAt),
        );
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (Notification.permission === 'denied') {
            return false;
        }

        if (Notification.permission === 'default') {
            const result = await Notification.requestPermission();
            if (result !== 'granted') {
                markPrompted();
                checkPermission();
                return false;
            }
        }

        const subscription = await subscribeToPush();
        if (subscription) {
            setIsSubscribed(true);
            markPrompted();
            checkPermission();
            return true;
        }

        return false;
    }, [markPrompted, checkPermission]);

    const unsubscribe = useCallback(async () => {
        await unsubscribeFromPush();
        setIsSubscribed(false);
    }, []);

    const markRead = useCallback(async (id: string) => {
        await markNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    }, []);

    const markAllRead = useCallback(async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        await Promise.all(unreadIds.map((id) => markNotificationRead(id)));
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, [notifications]);

    const deleteNotification = useCallback(async (id: string) => {
        await deleteStoredNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const showBanner = useCallback((notification: PushNotification) => {
        setActiveBanner(notification);
    }, []);

    const dismissBanner = useCallback(() => {
        setActiveBanner(null);
    }, []);

    // Check subscription status on mount. Guarded: the Android WebView (Capacitor)
    // resolves serviceWorker.ready to a registration with no pushManager, so this
    // must not throw — push is simply unavailable there.
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.ready
            .then((registration) => registration?.pushManager?.getSubscription())
            .then((sub) => setIsSubscribed(!!sub))
            .catch(() => { /* push unsupported (e.g. WebView) — ignore */ });
    }, []);

    // Load stored notifications on mount
    useEffect(() => {
        loadStoredNotifications();
    }, [loadStoredNotifications]);

    // Listen for push messages from service worker (MessageChannel)
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'PUSH_RECEIVED') {
                const notification: PushNotification = {
                    id: event.data.id,
                    type: event.data.notificationType || 'announcement',
                    title: event.data.title,
                    body: event.data.body,
                    deepLink: event.data.deepLink,
                    read: false,
                    receivedAt: Date.now(),
                };
                setNotifications((prev) => [notification, ...prev]);
                setActiveBanner(notification);
            }
        };

        navigator.serviceWorker.addEventListener('message', handler);
        return () => navigator.serviceWorker.removeEventListener('message', handler);
    }, []);

    return {
        permissionState,
        isSubscribed,
        subscribe,
        dismissPermissionPrompt: markPrompted,
        unsubscribe,
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        deleteNotification,
        refreshHistory,
        showBanner,
        activeBanner,
        dismissBanner,
    };
}