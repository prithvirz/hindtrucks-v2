// ─── HindTrucks Firebase Cloud Messaging Service Worker ───
// Handles background push notifications via FCM compat SDK.
// Separate from the Vite PWA Workbox SW to avoid bundling conflicts.

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyAain5de57rlYHN2bb5BXt6x1Qpfaxoeo0',
    authDomain: 'hindtruck.firebaseapp.com',
    projectId: 'hindtruck',
    storageBucket: 'hindtruck.firebasestorage.app',
    messagingSenderId: '151359237650',
    appId: '1:151359237650:web:10d570589c0a85626d72cb',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const { notification, data } = payload;
    const notificationId = data?.notificationId || crypto.randomUUID();
    const options = {
        body: notification?.body || data?.body || '',
        icon: data?.icon || '/pwa-192.png',
        badge: '/pwa-192.png',
        data: {
            deepLink: data?.deepLink || '/home',
            notificationId,
            type: data?.type || 'announcement',
            receivedAt: Date.now(),
        },
        tag: notificationId,
        requireInteraction: data?.requireInteraction === 'true',
        vibrate: [200, 100, 200],
    };

    self.registration.showNotification(
        notification?.title || data?.title || 'HindTrucks',
        options
    );

    // Store in IndexedDB for in-app NotificationCenter
    storeNotificationInIDB(payload);
});

// notificationclick: focus existing window or open deepLink
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const deepLink = event.notification.data?.deepLink || '/home';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NOTIFICATION_CLICKED', deepLink });
                    return;
                }
            }
            return clients.openWindow(deepLink);
        })
    );
});

async function storeNotificationInIDB(payload) {
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('hindtrucks_notifications', 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains('notifications')) {
                    request.result.createObjectStore('notifications', { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const { notification, data } = payload;
        const record = {
            id: data?.notificationId || crypto.randomUUID(),
            type: data?.type || 'announcement',
            title: notification?.title || data?.title || 'HindTrucks',
            body: notification?.body || data?.body || '',
            deepLink: data?.deepLink || '/home',
            read: false,
            receivedAt: Date.now(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };

        const tx = db.transaction('notifications', 'readwrite');
        tx.objectStore('notifications').put(record);
    } catch {
        // Silently fail — notification already shown to user
    }
}