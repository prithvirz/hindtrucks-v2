// ─── HindTrucks Service Worker Push Handler ───
// Registered via vite-plugin-pwa workbox.importScripts

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch {
        // Fallback: treat as text notification
        payload = {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: 'announcement',
            title: 'HindTrucks',
            body: event.data.text(),
        };
    }

    const options = {
        body: payload.body || '',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        data: {
            deepLink: payload.deepLink || '/',
            notificationId: payload.id || '',
            type: payload.type || 'announcement',
            timestamp: Date.now(),
        },
        tag: payload.type || 'hindtrucks',
        renotify: true,
        vibrate: [200, 100, 200],
        actions: payload.actions || [],
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(payload.title || 'HindTrucks', options),
            storeNotificationInIDB(payload).catch(() => {
                // IndexedDB unavailable in this SW scope — non-fatal
            }),
        ])
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const deepLink = event.notification.data?.deepLink || '/';

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new one
                return clients.openWindow(deepLink);
            })
    );
});

async function storeNotificationInIDB(payload) {
    // Open IndexedDB and store notification for in-app history
    const DB_NAME = 'hindtrucks_notifications';
    const STORE_NAME = 'notifications';

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const record = {
                id: payload.id || `sw-${Date.now()}`,
                type: payload.type || 'announcement',
                title: payload.title || '',
                body: payload.body || '',
                deepLink: payload.deepLink || null,
                read: false,
                receivedAt: Date.now(),
                expiresAt: payload.expiresAt || null,
            };

            store.put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
    });
}