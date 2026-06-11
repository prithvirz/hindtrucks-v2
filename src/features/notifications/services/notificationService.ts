// ─── Notification Service: Subscribe / Unsubscribe / History ───

import type { PushSubscriptionData, PushNotification } from '../types';
import { request } from '../../../services/apiClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return null;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        const data = subscription.toJSON() as PushSubscriptionData;
        await registerSubscription(data);
        return data;
    }

    if (!VAPID_PUBLIC_KEY) {
        console.warn('[notifications] VAPID_PUBLIC_KEY not configured');
        return null;
    }

    subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    });

    const data = subscription.toJSON() as PushSubscriptionData;

    await registerSubscription(data);

    return data;
}

export async function unsubscribeFromPush(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        try {
            const data = subscription.toJSON() as PushSubscriptionData;
            await unregisterSubscription(data.endpoint);
        } catch {
            // Server unregister may fail — continue with local unsubscription
        }
        await subscription.unsubscribe();
    }
}

async function registerSubscription(subscription: PushSubscriptionData): Promise<void> {
    try {
        await request({
            method: 'POST',
            path: '/notifications/subscribe',
            body: {
                ...subscription,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
            } as unknown as Record<string, unknown>,
        });
    } catch {
        // Non-blocking — subscription is valid locally even if server registration fails
        console.warn('[notifications] Failed to register subscription on server');
    }
}

async function unregisterSubscription(endpoint: string): Promise<void> {
    await request({
        method: 'DELETE',
        path: '/notifications/unsubscribe',
        body: { endpoint } as unknown as Record<string, unknown>,
    });
}

export async function fetchNotificationHistory(
    page = 1,
    limit = 20
): Promise<PushNotification[]> {
    try {
        const response = await request<PushNotification[]>({
            method: 'GET',
            path: '/notifications/history',
            query: { page: String(page), limit: String(limit) },
        });
        return response.data || [];
    } catch {
        return [];
    }
}

export function storeNotification(notification: PushNotification): Promise<void> {
    return new Promise((resolve) => {
        const DB_NAME = 'hindtrucks_notifications'
        const STORE_NAME = 'notifications'

        const request = indexedDB.open(DB_NAME, 1)

        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }

        request.onsuccess = () => {
            const db = request.result
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite')
                const store = tx.objectStore(STORE_NAME)
                store.put(notification)
                tx.oncomplete = () => resolve()
                tx.onerror = () => resolve()
            } catch {
                resolve()
            }
        }

        request.onerror = () => resolve()
    })
}

export function getStoredNotifications(): Promise<PushNotification[]> {
    return new Promise((resolve) => {
        const DB_NAME = 'hindtrucks_notifications';
        const STORE_NAME = 'notifications';

        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => {
            const db = request.result;
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const getAll = store.getAll();
                getAll.onsuccess = () => resolve(getAll.result || []);
                getAll.onerror = () => resolve([]);
            } catch {
                resolve([]);
            }
        };

        request.onerror = () => resolve([]);
    });
}

export function markNotificationRead(id: string): Promise<void> {
    return new Promise((resolve) => {
        const DB_NAME = 'hindtrucks_notifications';
        const STORE_NAME = 'notifications';

        const request = indexedDB.open(DB_NAME, 1);

        request.onsuccess = () => {
            const db = request.result;
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const getReq = store.get(id);
                getReq.onsuccess = () => {
                    if (getReq.result) {
                        getReq.result.read = true;
                        store.put(getReq.result);
                    }
                };
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        };

        request.onerror = () => resolve();
    });
}

export function deleteStoredNotification(id: string): Promise<void> {
    return new Promise((resolve) => {
        const DB_NAME = 'hindtrucks_notifications';
        const STORE_NAME = 'notifications';

        const request = indexedDB.open(DB_NAME, 1);

        request.onsuccess = () => {
            const db = request.result;
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch {
                resolve();
            }
        };

        request.onerror = () => resolve();
    });
}