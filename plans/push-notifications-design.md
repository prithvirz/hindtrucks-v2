# Push Notifications Enhancement — Firebase Cloud Messaging

**Status:** Draft  
**Date:** 2026-06-10  
**Goal:** Migrate from browser-native Web Push API (VAPID) to Firebase Cloud Messaging (FCM), expand notification types, integrate with service switching layer, and add comprehensive test coverage.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current State Assessment](#2-current-state-assessment)
3. [FCM Initialization & Environment](#3-fcm-initialization--environment)
4. [Push Permission Flow](#4-push-permission-flow)
5. [Token Management](#5-token-management)
6. [Foreground Message Handling](#6-foreground-message-handling)
7. [Background Message Handling](#7-background-message-handling)
8. [Notification Types Expansion](#8-notification-types-expansion)
9. [Notification Center Enhancements](#9-notification-center-enhancements)
10. [Service Layer Integration](#10-service-layer-integration)
11. [NotificationProvider & Context](#11-notificationprovider--context)
12. [Offline Handling](#12-offline-handling)
13. [Unit Tests](#13-unit-tests)
14. [Implementation Checklist](#14-implementation-checklist)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        AppProviders                               │
│  Theme > Auth > Shell > Profile > Trip > Earnings > Chat         │
│                    > NotificationProvider  ← NEW                  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  NotificationProvider (NEW)                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ useNotificationPermission() → permission state + cooldown   │ │
│  │ useFcmToken()              → token lifecycle                │ │
│  │ useForegroundMessages()    → onMessage handler              │ │
│  │ INotificationsService      → server registration (mock/real)│ │
│  │                                                              │ │
│  │ State: notifications[], unreadCount, activeBanner           │ │
│  │ Actions: markRead, markAllRead, delete, dismissBanner       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ PermissionPrompt│  │NotificationBanner│ │NotificationCenter│
│ (preserved)     │  │ (preserved)      │ │ (preserved)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Service Worker (public/firebase-messaging-sw.js — NEW)            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ importScripts('firebase-app-compat.js')                      │ │
│  │ importScripts('firebase-messaging-compat.js')                │ │
│  │ firebase.initializeApp(firebaseConfig)                       │ │
│  │ const messaging = firebase.messaging()                       │ │
│  │                                                              │ │
│  │ onBackgroundMessage(messaging, (payload) => {                │ │
│  │   self.registration.showNotification(...)                    │ │
│  │   storeInIndexedDB(payload)                                  │ │
│  │ })                                                           │ │
│  │                                                              │ │
│  │ self.addEventListener('notificationclick', ...) ← preserved  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Services Layer (NEW)                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ INotificationsService (src/services/types.ts)                │ │
│  │ ├── registerToken(token: string): Promise<void>             │ │
│  │ ├── unregisterToken(token: string): Promise<void>           │ │
│  │ ├── subscribeToTopic(topic: string): Promise<void>          │ │
│  │ ├── unsubscribeFromTopic(topic: string): Promise<void>      │ │
│  │ └── getHistory(page, limit): Promise<NotificationPage>      │ │
│  │                                                              │ │
│  │ notificationsService (src/services/mock/) — Mock             │ │
│  │ notificationsService (src/services/real/) — Real (NEW)       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| New NotificationProvider in context tree | Current push state is fragmented across hook + ShellContext; dedicated provider centralizes token lifecycle, foreground handling, and notification state |
| FCM compat SDK in service worker | `firebase-messaging-compat.js` works in SW scope without module bundling; aligns with Vite PWA plugin setup |
| Preserve existing UI components | NotificationBanner, NotificationCenter, PermissionPrompt are well-implemented; only integration points change |
| IndexedDB storage preserved | Existing `hindtrucks_notifications` DB schema works; FCM SW writes to same store |
| New `notifications` service key | Follows service-switching-design.md pattern for mock/real/hybrid resolution |
| `useFcmToken` hook (separate from `usePushNotifications`) | Token lifecycle is distinct from UI state; separation enables testing and reuse |
| VAPID key reuse | FCM Web SDK uses VAPID under the hood; `VITE_FCM_VAPID_KEY` replaces `VITE_VAPID_PUBLIC_KEY` |
| Topic-based targeting | Drivers subscribe to `driver_{driverId}` topic; operations subscribes to `trips`, `earnings`, `announcements` |

---

## 2. Current State Assessment

### 2.1 What Already Works

| Component | File | Status |
|-----------|------|--------|
| Notification types & interfaces | [`src/features/notifications/types.ts`](src/features/notifications/types.ts) | ✅ 5 types defined, PushPayload, PushNotification, subscription data |
| Permission hook | [`src/features/notifications/hooks/useNotificationPermission.ts`](src/features/notifications/hooks/useNotificationPermission.ts) | ✅ Browser Notification API, 7-day cooldown, localStorage tracking |
| Push subscription hook | [`src/features/notifications/hooks/usePushNotifications.ts`](src/features/notifications/hooks/usePushNotifications.ts) | ✅ Full lifecycle: subscribe, unsubscribe, history, stored notifications merge, banner state |
| Notification service | [`src/features/notifications/services/notificationService.ts`](src/features/notifications/services/notificationService.ts) | ✅ VAPID subscribe/unsubscribe, server registration, IndexedDB CRUD |
| SW push handler | [`public/sw-push-handler.js`](public/sw-push-handler.js) | ✅ push event → showNotification + IndexedDB, notificationclick → deepLink |
| NotificationBanner | [`src/features/notifications/components/NotificationBanner.tsx`](src/features/notifications/components/NotificationBanner.tsx) | ✅ Toasts with type-based colors, 8s auto-dismiss, tap-to-navigate |
| NotificationCenter | [`src/features/notifications/components/NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx) | ✅ Date-grouped history, swipe-to-delete, unread indicators, mark-all-read |
| PermissionPrompt | [`src/features/notifications/components/PermissionPrompt.tsx`](src/features/notifications/components/PermissionPrompt.tsx) | ✅ Modal with benefits list, Enable/Maybe Later, i18n support |
| Firebase app | [`src/lib/firebase.ts`](src/lib/firebase.ts) | ✅ Auth, Firestore, Storage initialized; project `hindtruck` |
| IndexedDB | `hindtrucks_notifications` / `notifications` store | ✅ Read/write from both main thread and service worker |
| package.json | `firebase: ^12.14.0` | ✅ Includes `firebase/messaging` SDK |

### 2.2 What's Missing

| Gap | Impact |
|-----|--------|
| No `getMessaging(app)` initialization | FCM SDK not usable; all push currently goes through browser-native Push API |
| VAPID key used directly, not through FCM | Server must send to browser Push API endpoint; FCM would handle this internally |
| No `INotificationsService` interface | Can't switch between mock/real; no service key `notifications` |
| No `NotificationProvider` in context tree | Push state lives in standalone hook; no shared context for token + message state |
| No foreground message handling | `onMessage` not used; only SW `push` event handles messages |
| SW uses raw `push` event, not `onBackgroundMessage` | FCM requires its own SW message handler for background delivery |
| `sw-push-handler.js` separate from Vite PWA SW | Vite PWA plugin generates SW; FCM SW needs to be co-located or imported |
| Notification types limited to 5 | Missing: `trip_reminder`, `geofence_alert`, `chat_message`, `system_announcement` |
| No topic-based subscription | All targets are individual device endpoints; no bulk targeting |
| No token refresh handling | If FCM rotates token, app won't update server |
| No offline notification queue | Push received while app in foreground isn't persisted if DB write fails |
| No unit tests for any notification files | 0 test files in `src/features/notifications/` |

### 2.3 Test Coverage Gap Analysis

| File | Has Test | Priority |
|------|:---:|:---:|
| [`types.ts`](src/features/notifications/types.ts) | ❌ | P2 — Type-only, low risk |
| [`useNotificationPermission.ts`](src/features/notifications/hooks/useNotificationPermission.ts) | ❌ | P0 — Core permission logic |
| [`usePushNotifications.ts`](src/features/notifications/hooks/usePushNotifications.ts) | ❌ | P0 — Will be refactored into FCM hooks |
| [`notificationService.ts`](src/features/notifications/services/notificationService.ts) | ❌ | P0 — Core service being replaced |
| [`NotificationBanner.tsx`](src/features/notifications/components/NotificationBanner.tsx) | ❌ | P1 — UI component, auto-dismiss |
| [`NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx) | ❌ | P1 — Date grouping, swipe delete |
| [`PermissionPrompt.tsx`](src/features/notifications/components/PermissionPrompt.tsx) | ❌ | P1 — Modal, enable/dismiss flow |
| `sw-push-handler.js` | ❌ | P2 — SW testing is complex; E2E preferred |
| New: `useFcmToken.ts` | ❌ | P0 — Will be created |
| New: `useForegroundMessages.ts` | ❌ | P0 — Will be created |
| New: `NotificationProvider.tsx` | ❌ | P1 — Integration test |
| New: `notificationsService.ts` (mock) | ❌ | P0 — Will be created |
| New: `notificationsService.ts` (real) | ❌ | P1 — Requires FCM mocking |

---

## 3. FCM Initialization & Environment

### 3.1 Changes to [`src/lib/firebase.ts`](src/lib/firebase.ts)

Add `getMessaging` import and initialization:

```typescript
// Current imports (lines 1-4):
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Add:
import { getMessaging } from 'firebase/messaging';

// After existing exports (after line 24), add:
export const messaging = getMessaging(app);
```

### 3.2 Environment Variables

| Variable | Purpose | Required |
|----------|---------|:---:|
| `VITE_FCM_VAPID_KEY` | FCM Web Push VAPID key (replaces `VITE_VAPID_PUBLIC_KEY`) | Yes |
| `VITE_API_NOTIFICATIONS` | Service mode: `mock` or `real` | Hybrid mode |
| `VITE_FCM_PROJECT_ID` | Firebase project ID for SW config | No (use existing config) |
| `VITE_FCM_APP_ID` | Firebase app ID for SW config | No (use existing config) |
| `VITE_FCM_MESSAGING_SENDER_ID` | Sender ID for SW config | No (use existing config) |

Update [`.env.example`](.env.example):

```diff
- VITE_VAPID_PUBLIC_KEY=
+ VITE_FCM_VAPID_KEY=
+ VITE_API_NOTIFICATIONS=mock
```

### 3.3 Service Worker Strategy

Vite PWA plugin (`vite-plugin-pwa`) generates the main service worker. FCM requires its own messaging service worker or the main SW must import Firebase compat scripts.

**Decision: Use dedicated FCM service worker** (`public/firebase-messaging-sw.js`), separate from the Vite PWA SW. Configure FCM to use this SW via `messaging.onBackgroundMessage()` registration.

Why separate SW:
- Vite PWA SW is auto-generated with workbox; injecting FCM into it is fragile
- FCM compat SDK works in standalone SW without bundling
- `getMessaging(messaging, { serviceWorkerRegistration })` lets us specify which SW handles FCM
- Existing `sw-push-handler.js` approaches can be consolidated into this new SW

**New file:** `public/firebase-messaging-sw.js`

```javascript
// Firebase compat SDKs for service worker scope
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyBktN8quB4UHQPLbuSNba1TEzIjeMfhBOE',
    authDomain: 'hindtruck.firebaseapp.com',
    projectId: 'hindtruck',
    storageBucket: 'hindtruck.firebasestorage.app',
    messagingSenderId: '822699524679',
    appId: '1:822699524679:web:39004cf9010b727a7cb662',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const { notification, data } = payload;
    const options = {
        body: notification?.body || data?.body || '',
        icon: data?.icon || '/pwa-192.png',
        badge: '/pwa-192.png',
        data: {
            deepLink: data?.deepLink || '/home',
            notificationId: data?.notificationId || crypto.randomUUID(),
            type: data?.type || 'announcement',
            receivedAt: Date.now(),
        },
        tag: data?.notificationId || undefined,
        requireInteraction: data?.requireInteraction === 'true',
    };

    self.registration.showNotification(
        notification?.title || data?.title || 'HindTrucks',
        options
    );

    // Store in IndexedDB for NotificationCenter
    storeNotificationInIDB(payload);
});

// Preserved from sw-push-handler.js
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

// Preserved IndexedDB storage from sw-push-handler.js
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
        // Silently fail — notification still shown to user
    }
}
```

**Remove:** [`public/sw-push-handler.js`](public/sw-push-handler.js) — functionality consolidated into `firebase-messaging-sw.js`.

---

## 4. Push Permission Flow

### 4.1 Current State

[`useNotificationPermission.ts`](src/features/notifications/hooks/useNotificationPermission.ts) manages `Notification.permission` state with 7-day cooldown. The hook is well-implemented and largely reusable.

### 4.2 Required Changes

| Change | File | Rationale |
|--------|------|-----------|
| Add `requestPermission()` function | `useNotificationPermission.ts` | FCM `getToken()` requires permission first; expose explicit request |
| Export `isPermissionGranted` helper | `useNotificationPermission.ts` | Used by `useFcmToken` before calling `getToken()` |
| Add `permissionDenied` state tracking | `useNotificationPermission.ts` | Track if user clicked "Block" to show settings redirect guidance |

### 4.3 Modified Interface

```typescript
// Current (src/features/notifications/hooks/useNotificationPermission.ts:7-12):
interface UseNotificationPermissionReturn {
    permissionState: NotificationPermissionState;
    checkPermission: () => void;
    markPrompted: () => void;
    resetPromptCooldown: () => void;
}

// Enhanced:
interface UseNotificationPermissionReturn {
    permissionState: NotificationPermissionState;
    isGranted: boolean;                    // NEW: derived convenience
    isDenied: boolean;                     // NEW: did user block?
    checkPermission: () => void;
    requestPermission: () => Promise<boolean>;  // NEW: explicit permission request
    markPrompted: () => void;
    resetPromptCooldown: () => void;
}
```

### 4.4 Permission Flow Diagram

```
App Start
   │
   ▼
checkPermission() → reads Notification.permission + localStorage cooldown
   │
   ├── 'granted' → isGranted=true, proceed to FCM token
   │
   ├── 'denied' → isDenied=true, show "Enable in Settings" guidance
   │
   └── 'default' → check cooldown
                     │
                     ├── within 7 days → show subtle reminder
                     │
                     └── outside cooldown → show PermissionPrompt modal
                              │
                              ├── "Enable" → requestPermission()
                              │                │
                              │                ├── granted → isGranted=true, proceed to FCM
                              │                └── denied → isDenied=true, markPrompted()
                              │
                              └── "Maybe Later" → markPrompted(), dismiss
```

---

## 5. Token Management

### 5.1 New Hook: [`src/features/notifications/hooks/useFcmToken.ts`](src/features/notifications/hooks/useFcmToken.ts)

Replaces the subscription logic currently in `usePushNotifications.ts`. Manages FCM token lifecycle.

```typescript
interface UseFcmTokenReturn {
    /** Current FCM token, or null if not yet obtained */
    token: string | null;
    /** Whether token is being fetched */
    isLoading: boolean;
    /** Error message if token fetch failed */
    error: string | null;
    /** Manually request a new token */
    getToken: () => Promise<string | null>;
    /** Delete current token and unsubscribe from server */
    deleteToken: () => Promise<void>;
    /** Whether the user has granted notification permission */
    isPermissionGranted: boolean;
}
```

**Implementation outline:**

1. `useNotificationPermission()` provides `isGranted`
2. When `isGranted` becomes true, call `getToken(messaging, { vapidKey: import.meta.env.VITE_FCM_VAPID_KEY })`
3. On success: store token in state + `localStorage`, call `INotificationsService.registerToken(token)`
4. `onTokenRefresh(messaging, callback)` — update server when token rotates
5. `deleteToken()` — call `INotificationsService.unregisterToken()`, then `deleteToken(messaging)`
6. Subscribe to driver-specific topic: `INotificationsService.subscribeToTopic('driver_{id}')`

**Token-to-server registration flow:**

```
useFcmToken
   │
   ├── isGranted → getToken(messaging, { vapidKey })
   │                  │
   │                  ├── success → token
   │                  │               │
   │                  │               ├── localStorage.setItem('fcm_token', token)
   │                  │               ├── notificationsService.registerToken(token)
   │                  │               └── notificationsService.subscribeToTopic(`driver_${driverId}`)
   │                  │
   │                  └── error → set error state, retry in 30s
   │
   └── onTokenRefresh → newToken
                          │
                          ├── localStorage.setItem('fcm_token', newToken)
                          └── notificationsService.registerToken(newToken)
```

### 5.2 Key Differences from Current VAPID Approach

| Aspect | Current (VAPID) | New (FCM) |
|--------|----------------|-----------|
| Token source | `pushManager.subscribe()` returns `PushSubscription` | `getToken(messaging)` returns string token |
| Token format | `PushSubscription` object with endpoint, keys | Simple string token |
| Token refresh | None — subscription is stable until unsubscribe | `onTokenRefresh` callback handles rotation |
| Server registration | POST `/notifications/subscribe` with full subscription | POST `/notifications/register-token` with token string |
| Server unregistration | DELETE `/notifications/unsubscribe` with endpoint | POST `/notifications/unregister-token` with token string |

---

## 6. Foreground Message Handling

### 6.1 New Hook: [`src/features/notifications/hooks/useForegroundMessages.ts`](src/features/notifications/hooks/useForegroundMessages.ts)

Replaces the `PUSH_RECEIVED` message event listener in `usePushNotifications.ts`. Uses FCM's `onMessage()` API.

```typescript
interface UseForegroundMessagesReturn {
    /** Latest foreground message, or null */
    activeBanner: PushNotification | null;
    /** Dismiss the current banner */
    dismissBanner: () => void;
}
```

**Implementation outline:**

1. Call `onMessage(messaging, handler)` on mount
2. Handler receives `MessagePayload` — normalize to `PushNotification` type
3. Store in IndexedDB via existing `storeNotification` helper
4. Set `activeBanner` state for NotificationBanner display
5. Auto-dismiss banner after 8 seconds (preserved from current NotificationBanner behavior)
6. Provide `dismissBanner()` to clear the banner

**Message normalization:**

```typescript
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
    };
}
```

### 6.2 Integration with NotificationBanner

[`NotificationBanner.tsx`](src/features/notifications/components/NotificationBanner.tsx) requires **no code changes**. It receives `notification`, `onDismiss`, `onTap` as props — the provider will pass the `activeBanner` from `useForegroundMessages`.

---

## 7. Background Message Handling

### 7.1 Service Worker: `public/firebase-messaging-sw.js`

Background messages are handled entirely in the service worker via `onBackgroundMessage(messaging, handler)`. See Section 3.3 for the complete SW file.

### 7.2 Main Thread: Detecting Background-Opened Notifications

When the user clicks a background notification, the app may already be open or closed:

- **App closed:** `clients.openWindow(deepLink)` — app loads fresh, reads IndexedDB for unread count
- **App open:** SW posts `NOTIFICATION_CLICKED` message → `useForegroundMessages` or `NotificationProvider` listens and navigates

Add to `useForegroundMessages.ts` (or `NotificationProvider`):

```typescript
useEffect(() => {
    const handler = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
            // Navigate to deepLink via app router
            navigate(event.data.deepLink);
        }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
}, []);
```

### 7.3 Comparison: Old vs New SW

| Aspect | Old (`sw-push-handler.js`) | New (`firebase-messaging-sw.js`) |
|--------|---------------------------|----------------------------------|
| Push event | `self.addEventListener('push', ...)` | `messaging.onBackgroundMessage(...)` |
| Payload format | Raw JSON from Push API | FCM `MessagePayload` with `notification` + `data` |
| showNotification | Manual `self.registration.showNotification()` | Same call, but from FCM handler |
| IndexedDB | `storeNotificationInIDB()` | Same function, preserved |
| notificationclick | Same listener | Preserved identically |
| Firebase init | None | `firebase.initializeApp()` via compat SDKs |

---

## 8. Notification Types Expansion

### 8.1 Changes to [`src/features/notifications/types.ts`](src/features/notifications/types.ts)

```typescript
// Current (line 3-8):
export type NotificationType =
    | 'new_load'
    | 'accepted'
    | 'status_update'
    | 'earnings'
    | 'announcement';

// Expanded:
export type NotificationType =
    | 'new_load'           // New load available for bidding
    | 'accepted'           // Load bid accepted by shipper
    | 'status_update'      // Trip status changed (pickup, in-transit, delivered)
    | 'earnings'           // Payment credited, withdrawal processed
    | 'announcement'       // System-wide broadcast
    | 'trip_reminder'      // Reminder before scheduled pickup/delivery
    | 'geofence_alert'     // Entered/exited pickup or delivery zone
    | 'chat_message'       // New message from shipper/operations
    | 'system_announcement'; // Critical system notifications (maintenance, TOS update)
```

### 8.2 Updated Color/Icon Map for NotificationBanner

```typescript
// In NotificationBanner.tsx — extend the existing color/icon map:
const typeConfig: Record<NotificationType, { bg: string; icon: LucideIcon }> = {
    new_load:           { bg: 'bg-blue-500',        icon: Package },
    accepted:           { bg: 'bg-green-500',       icon: CheckCircle },
    status_update:      { bg: 'bg-amber-500',       icon: Truck },
    earnings:           { bg: 'bg-emerald-500',     icon: Wallet },
    announcement:       { bg: 'bg-slate-500',       icon: Bell },
    // NEW:
    trip_reminder:      { bg: 'bg-indigo-500',      icon: Clock },
    geofence_alert:     { bg: 'bg-orange-500',      icon: MapPin },
    chat_message:       { bg: 'bg-violet-500',      icon: MessageCircle },
    system_announcement:{ bg: 'bg-red-500',         icon: AlertTriangle },
};
```

### 8.3 PushPayload Update

```typescript
// Current (lines 10-18):
export interface PushPayload {
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    actions?: NotificationAction[];
}

// Enhanced: add metadata fields
export interface PushPayload {
    type: NotificationType;
    title: string;
    body: string;
    deepLink?: string;
    /** Optional: load/trip ID for contextual navigation */
    entityId?: string;
    /** Optional: image URL for rich notifications */
    imageUrl?: string;
    /** Whether notification requires user interaction (no auto-dismiss) */
    requireInteraction?: boolean;
    /** ISO timestamp for scheduled delivery */
    scheduledAt?: string;
    /** Time-to-live in seconds */
    ttlSeconds?: number;
    actions?: NotificationAction[];
}
```

---

## 9. Notification Center Enhancements

[`NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx) is well-implemented. Minimal changes needed.

### 9.1 Changes

| Change | Rationale |
|--------|-----------|
| Add type filter tabs | Allow filtering by notification type (All, Loads, Trip, Earnings, Messages) |
| Add "Pull to refresh" | Fetch latest from server when pulled down |
| Add pagination | Currently loads all from IndexedDB; add infinite scroll with `getHistory(page)` |
| Add empty state per filter | "No load notifications" vs "No messages" differentiated empty states |

### 9.2 Modified Props

```typescript
// Current (NotificationCenter.tsx:9-16):
interface NotificationCenterProps {
    notifications: PushNotification[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onDelete: (id: string) => void;
}

// Enhanced:
interface NotificationCenterProps {
    notifications: PushNotification[];
    unreadCount: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
    onDelete: (id: string) => void;
    // NEW:
    onRefresh?: () => Promise<void>;         // Pull-to-refresh
    onLoadMore?: () => Promise<void>;        // Infinite scroll
    hasMore?: boolean;                       // Pagination indicator
    activeFilter?: NotificationType | 'all'; // Type filter
    onFilterChange?: (filter: NotificationType | 'all') => void;
}
```

---

## 10. Service Layer Integration

### 10.1 New Interface: [`src/services/types.ts`](src/services/types.ts)

Add after the existing `IChatService` interface:

```typescript
/** Page of notifications returned from server */
export interface NotificationPage {
    items: PushNotification[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/** Server-side notification registration */
export interface INotificationsService {
    /** Register FCM token with backend for push delivery */
    registerToken(token: string): Promise<void>;
    /** Remove FCM token from backend (user signs out or revokes permission) */
    unregisterToken(token: string): Promise<void>;
    /** Subscribe to a Firebase Cloud Messaging topic */
    subscribeToTopic(topic: string): Promise<void>;
    /** Unsubscribe from a Firebase Cloud Messaging topic */
    unsubscribeFromTopic(topic: string): Promise<void>;
    /** Fetch notification history from server */
    getHistory(page?: number, limit?: number): Promise<NotificationPage>;
    /** Mark a notification as read on the server */
    markRead(notificationId: string): Promise<void>;
    /** Mark all notifications as read on the server */
    markAllRead(): Promise<void>;
}
```

### 10.2 New Service Key

Add `'notifications'` to the service key union and resolver in [`src/services/index.ts`](src/services/index.ts):

```typescript
// In resolveServiceMode (line 34-40), add:
case 'notifications':
    return import.meta.env.VITE_API_NOTIFICATIONS === 'real' ? 'real' : 'mock';

// In the service imports, add:
import { createMockNotificationsService } from './mock/notificationsService';
import { createRealNotificationsService } from './real/notificationsService';

// In getServices(), add:
notifications:
    resolveServiceMode('notifications') === 'real'
        ? createRealNotificationsService()
        : createMockNotificationsService(),
```

### 10.3 Mock Implementation

**New file:** [`src/services/mock/notificationsService.ts`](src/services/mock/notificationsService.ts)

```typescript
import type { INotificationsService, NotificationPage } from '../types';

export function createMockNotificationsService(): INotificationsService {
    let tokens: string[] = [];
    let topics: string[] = [];
    const mockNotifications: any[] = [];

    return {
        async registerToken(token: string) {
            tokens.push(token);
        },
        async unregisterToken(token: string) {
            tokens = tokens.filter(t => t !== token);
        },
        async subscribeToTopic(topic: string) {
            topics.push(topic);
        },
        async unsubscribeFromTopic(topic: string) {
            topics = topics.filter(t => t !== topic);
        },
        async getHistory(page = 1, limit = 20): Promise<NotificationPage> {
            const start = (page - 1) * limit;
            const items = mockNotifications.slice(start, start + limit);
            return {
                items: items as any[],
                total: mockNotifications.length,
                page,
                limit,
                hasMore: start + limit < mockNotifications.length,
            };
        },
        async markRead(notificationId: string) {
            const n = mockNotifications.find(x => x.id === notificationId);
            if (n) n.read = true;
        },
        async markAllRead() {
            mockNotifications.forEach(n => { n.read = true; });
        },
    };
}
```

### 10.4 Real Implementation

**New file:** [`src/services/real/notificationsService.ts`](src/services/real/notificationsService.ts)

```typescript
import { apiClient } from '../apiClient';
import type { INotificationsService, NotificationPage } from '../types';

export function createRealNotificationsService(): INotificationsService {
    return {
        async registerToken(token: string) {
            await apiClient.post('/notifications/register-token', { token });
        },
        async unregisterToken(token: string) {
            await apiClient.post('/notifications/unregister-token', { token });
        },
        async subscribeToTopic(topic: string) {
            await apiClient.post('/notifications/subscribe-topic', { topic });
        },
        async unsubscribeFromTopic(topic: string) {
            await apiClient.post('/notifications/unsubscribe-topic', { topic });
        },
        async getHistory(page = 1, limit = 20): Promise<NotificationPage> {
            const response = await apiClient.get('/notifications/history', {
                params: { page, limit },
            });
            return response.data;
        },
        async markRead(notificationId: string) {
            await apiClient.patch(`/notifications/${notificationId}/read`);
        },
        async markAllRead() {
            await apiClient.patch('/notifications/read-all');
        },
    };
}
```

### 10.5 Env Var and Service Key Summary

| Env Var | Service Key | Default |
|---------|-------------|---------|
| `VITE_API_AUTH` | `auth` | mock |
| `VITE_API_LOADS` | `loads` | mock |
| `VITE_API_TRIP` | `trip` | mock |
| `VITE_API_EARNINGS` | `earnings` | mock |
| `VITE_API_PROFILE` | `profile` | mock |
| `VITE_API_CHAT` | `chat` | mock |
| **`VITE_API_NOTIFICATIONS`** | **`notifications`** | **mock** |

---

## 11. NotificationProvider & Context

### 11.1 New File: [`src/state/NotificationContext.tsx`](src/state/NotificationContext.tsx)

Centralizes all push notification state — replaces the standalone `usePushNotifications` hook approach.

```typescript
interface NotificationContextValue {
    // Permission
    permissionState: NotificationPermissionState;
    isPermissionGranted: boolean;
    isPermissionDenied: boolean;
    requestPermission: () => Promise<boolean>;

    // FCM Token
    fcmToken: string | null;
    isTokenLoading: boolean;

    // Notifications
    notifications: PushNotification[];
    unreadCount: number;
    activeBanner: PushNotification | null;

    // Actions
    markRead: (id: string) => void;
    markAllRead: () => void;
    deleteNotification: (id: string) => void;
    dismissBanner: () => void;
    refreshHistory: () => Promise<void>;
}
```

**Implementation outline:**

1. Wraps children with `NotificationContext.Provider`
2. Internally uses:
   - `useNotificationPermission()` → permission state
   - `useFcmToken()` → token lifecycle
   - `useForegroundMessages()` → banner + message handling
   - `getStoredNotifications()` + `fetchNotificationHistory()` → merged notification list
3. Computes `unreadCount` from notifications array
4. Exposes actions that update both IndexedDB + server

### 11.2 Changes to [`src/state/AppProviders.tsx`](src/state/AppProviders.tsx)

Add `NotificationProvider` to the provider tree:

```tsx
// Current (lines 11-27):
return (
    <ThemeProvider>
        <AuthProvider>
            <ShellProvider>
                <ProfileProvider>
                    <TripProvider>
                        <EarningsProvider>
                            <ChatProvider>
                                {children}
                            </ChatProvider>
                        </EarningsProvider>
                    </TripProvider>
                </ProfileProvider>
            </ShellProvider>
        </AuthProvider>
    </ThemeProvider>
);

// Enhanced:
return (
    <ThemeProvider>
        <AuthProvider>
            <ShellProvider>
                <NotificationProvider>  {/* NEW */}
                    <ProfileProvider>
                        <TripProvider>
                            <EarningsProvider>
                                <ChatProvider>
                                    {children}
                                </ChatProvider>
                            </EarningsProvider>
                        </TripProvider>
                    </ProfileProvider>
                </NotificationProvider>  {/* NEW */}
            </ShellProvider>
        </AuthProvider>
    </ThemeProvider>
);
```

**Position rationale:** Inside ShellProvider (has access to online status, auth state) but outside feature providers (Profile, Trip, etc.) so notification context is available everywhere.

### 11.3 Hook: [`src/hooks/useNotifications.ts`](src/hooks/useNotifications.ts)

Convenience hook for consuming notification context:

```typescript
import { useContext } from 'react';
import { NotificationContext } from '../state/NotificationContext';

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
```

### 11.4 Removal of `usePushNotifications`

[`src/features/notifications/hooks/usePushNotifications.ts`](src/features/notifications/hooks/usePushNotifications.ts) — **deprecated and removed**. Its functionality is split across:
- `useFcmToken.ts` — token lifecycle
- `useForegroundMessages.ts` — foreground message handling
- `NotificationContext.tsx` — state orchestration
- `getStoredNotifications()` from `notificationService.ts` — IndexedDB reads

---

## 12. Offline Handling

### 12.1 Strategy

Push notifications are inherently server-initiated, so the main offline concern is:

1. **Token registration when offline:** Queue `registerToken` call, replay on reconnect
2. **Notification receipt while app in foreground but offline:** Cannot happen (needs network for FCM delivery)
3. **markRead/delete while offline:** Apply to IndexedDB immediately, sync to server on reconnect
4. **Token refresh while offline:** Queue new token, register on reconnect

### 12.2 Integration with Existing Offline Queue

Use the offline queue infrastructure from [`plans/offline-queue-design.md`](plans/offline-queue-design.md):

| Action | Offline Behavior |
|--------|-----------------|
| `registerToken` | Queue as `register_fcm_token`; replay on reconnect |
| `unregisterToken` | Queue as `unregister_fcm_token`; replay on reconnect |
| `markRead` | Update IndexedDB immediately; queue server sync |
| `markAllRead` | Update IndexedDB immediately; queue server sync |
| Notification delivery | Server side — FCM handles retries, message TTL |

### 12.3 IndexedDB Schema

Existing schema is sufficient — no migration needed:

```
Database: hindtrucks_notifications
Object Store: notifications
Key Path: id
Fields: id, type, title, body, deepLink, read, receivedAt, expiresAt
```

### 12.4 Read/Write Synchronization

When online returns:
1. `NotificationProvider` detects `wasOffline → isOnline` transition
2. Flushes queued `markRead` / `markAllRead` actions to server
3. Re-registers FCM token to handle any rotation during offline
4. Fetches `getHistory()` to pull notifications missed while offline (server-side TTL handles delivery)

---

## 13. Unit Tests

### 13.1 Test Plan

| File | Test File | Focus Areas |
|------|-----------|-------------|
| `useNotificationPermission.ts` | `useNotificationPermission.test.ts` | Permission states, cooldown logic, localStorage interaction, `requestPermission` flow |
| `useFcmToken.ts` | `useFcmToken.test.ts` | Token fetch success/failure, token refresh, server registration, permission gating |
| `useForegroundMessages.ts` | `useForegroundMessages.test.ts` | `onMessage` handler, banner state, message normalization, auto-dismiss |
| `NotificationBanner.tsx` | `NotificationBanner.test.tsx` | Render per type, auto-dismiss timer, onTap/onDismiss callbacks |
| `NotificationCenter.tsx` | `NotificationCenter.test.tsx` | Date grouping, swipe-to-delete, mark-all-read, empty states, filter tabs |
| `PermissionPrompt.tsx` | `PermissionPrompt.test.tsx` | Modal visibility, Enable/Maybe Later buttons, loading state, i18n |
| `NotificationContext.tsx` | `NotificationContext.test.tsx` | Provider integration, state flow, context error boundary |
| `notificationsService.ts` (mock) | `notificationsService.test.ts` | All methods, state tracking |
| `notificationsService.ts` (real) | `notificationsService.test.ts` | API client mocking, request/response mapping |

### 13.2 Testing Considerations

- **FCM mocking:** Mock `firebase/messaging` module. `getToken` returns a test token. `onMessage` invokes handler with test payload. `onTokenRefresh` is stubbed.
- **Service Worker testing:** Not unit-testable. Covered by E2E tests (future).
- **IndexedDB mocking:** Use `fake-indexeddb` or mock the `idb` library.
- **Notification API mocking:** `globalThis.Notification` is available in jsdom; mock `requestPermission`.

### 13.3 Test Configuration

No additional Vitest configuration needed — existing `jsdom` environment supports `Notification` API and IndexedDB can be mocked with `fake-indexeddb` (add to devDependencies).

---

## 14. Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] **1.1** Add `getMessaging` import and export in [`src/lib/firebase.ts`](src/lib/firebase.ts)
- [ ] **1.2** Add `VITE_FCM_VAPID_KEY` and `VITE_API_NOTIFICATIONS` to [`.env.example`](.env.example)
- [ ] **1.3** Create [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) with FCM compat SDK + IndexedDB storage
- [ ] **1.4** Remove [`public/sw-push-handler.js`](public/sw-push-handler.js)
- [ ] **1.5** Update `vite-plugin-pwa` config if needed for dual SW setup
- [ ] **1.6** Expand `NotificationType` union in [`src/features/notifications/types.ts`](src/features/notifications/types.ts:3-8) — add 4 new types
- [ ] **1.7** Enhance `PushPayload` interface in [`src/features/notifications/types.ts`](src/features/notifications/types.ts:10-18) — add entityId, imageUrl, requireInteraction, scheduledAt, ttlSeconds

### Phase 2: Service Layer

- [ ] **2.1** Add `INotificationsService` interface to [`src/services/types.ts`](src/services/types.ts)
- [ ] **2.2** Add `NotificationPage` export to [`src/services/types.ts`](src/services/types.ts)
- [ ] **2.3** Create [`src/services/mock/notificationsService.ts`](src/services/mock/notificationsService.ts)
- [ ] **2.4** Create [`src/services/real/notificationsService.ts`](src/services/real/notificationsService.ts)
- [ ] **2.5** Add `'notifications'` service key to `resolveServiceMode` in [`src/services/index.ts`](src/services/index.ts:34-40)
- [ ] **2.6** Add `notifications` to `getServices()` return in [`src/services/index.ts`](src/services/index.ts)
- [ ] **2.7** Export `NotificationPage` from service barrel (if needed)

### Phase 3: Hooks Refactor

- [ ] **3.1** Add `requestPermission()` and derived states to [`useNotificationPermission.ts`](src/features/notifications/hooks/useNotificationPermission.ts)
- [ ] **3.2** Create [`src/features/notifications/hooks/useFcmToken.ts`](src/features/notifications/hooks/useFcmToken.ts) — token lifecycle hook
- [ ] **3.3** Create [`src/features/notifications/hooks/useForegroundMessages.ts`](src/features/notifications/hooks/useForegroundMessages.ts) — onMessage handler hook
- [ ] **3.4** Update [`notificationService.ts`](src/features/notifications/services/notificationService.ts) — keep IndexedDB helpers, remove VAPID-specific subscribe/unsubscribe
- [ ] **3.5** Remove [`usePushNotifications.ts`](src/features/notifications/hooks/usePushNotifications.ts)

### Phase 4: NotificationProvider

- [ ] **4.1** Create [`src/state/NotificationContext.tsx`](src/state/NotificationContext.tsx) — provider + context
- [ ] **4.2** Create [`src/hooks/useNotifications.ts`](src/hooks/useNotifications.ts) — consumer hook
- [ ] **4.3** Add `NotificationProvider` to provider tree in [`src/state/AppProviders.tsx`](src/state/AppProviders.tsx)
- [ ] **4.4** Wire `NotificationBanner` in app shell to `useNotifications().activeBanner`
- [ ] **4.5** Wire `NotificationCenter` to `useNotifications()` state

### Phase 5: Component Updates

- [ ] **5.1** Extend color/icon map in [`NotificationBanner.tsx`](src/features/notifications/components/NotificationBanner.tsx:43-46) — add 4 new types
- [ ] **5.2** Add type filter tabs to [`NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx)
- [ ] **5.3** Add empty states per filter to [`NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx)
- [ ] **5.4** No changes needed to [`PermissionPrompt.tsx`](src/features/notifications/components/PermissionPrompt.tsx)

### Phase 6: Offline Integration

- [ ] **6.1** Add `register_fcm_token` / `unregister_fcm_token` / `sync_notification_read` to `OfflineAction.type` union in [`src/features/offline/types.ts`](src/features/offline/types.ts:5)
- [ ] **6.2** Add `dispatchAction` handlers for notification actions in [`src/features/offline/services/actionDispatcher.ts`](src/features/offline/services/actionDispatcher.ts)
- [ ] **6.3** Wire token registration retry on `wasOffline → isOnline` in `NotificationProvider`

### Phase 7: Unit Tests

- [ ] **7.1** `useNotificationPermission.test.ts` — permission states, cooldown, localStorage
- [ ] **7.2** `useFcmToken.test.ts` — token fetch, refresh, server registration
- [ ] **7.3** `useForegroundMessages.test.ts` — onMessage handler, banner states
- [ ] **7.4** `NotificationBanner.test.tsx` — render, auto-dismiss, callbacks
- [ ] **7.5** `NotificationCenter.test.tsx` — date grouping, swipe, filters, empty states
- [ ] **7.6** `PermissionPrompt.test.tsx` — modal visibility, enable/dismiss, loading
- [ ] **7.7** `NotificationContext.test.tsx` — integration test
- [ ] **7.8** `notificationsService.test.ts` (mock) — all methods
- [ ] **7.9** `notificationsService.test.ts` (real) — API client mocking
- [ ] **7.10** Run `npm run typecheck` and `npm run test:run` to verify

### Phase 8: Polish (Optional / Lower Priority)

- [ ] **8.1** Add `imageUrl` support for rich notifications with images in `NotificationBanner`
- [ ] **8.2** Add notification grouping (same entityId notifications grouped in NotificationCenter)
- [ ] **8.3** Add notification preferences screen (opt-in/out per type)
- [ ] **8.4** E2E test for push notification flow (requires FCM test environment)
- [ ] **8.5** Add `requireInteraction` support — sticky notifications that don't auto-dismiss
- [ ] **8.6** i18n strings for new notification types and UI text
- [ ] **8.7** Notification sound/vibration configuration

---

## Appendix A: File Manifest

| File | Action | Purpose |
|------|--------|---------|
| [`src/lib/firebase.ts`](src/lib/firebase.ts) | Modify | Add `getMessaging` initialization |
| [`.env.example`](.env.example) | Modify | Replace `VITE_VAPID_PUBLIC_KEY` with `VITE_FCM_VAPID_KEY`, add `VITE_API_NOTIFICATIONS` |
| [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js) | **Create** | FCM compat SW with onBackgroundMessage + IndexedDB |
| [`public/sw-push-handler.js`](public/sw-push-handler.js) | **Delete** | Consolidated into firebase-messaging-sw.js |
| [`src/features/notifications/types.ts`](src/features/notifications/types.ts) | Modify | Expand NotificationType union, enhance PushPayload |
| [`src/features/notifications/hooks/useNotificationPermission.ts`](src/features/notifications/hooks/useNotificationPermission.ts) | Modify | Add requestPermission(), derived boolean states |
| [`src/features/notifications/hooks/useFcmToken.ts`](src/features/notifications/hooks/useFcmToken.ts) | **Create** | FCM token lifecycle hook |
| [`src/features/notifications/hooks/useForegroundMessages.ts`](src/features/notifications/hooks/useForegroundMessages.ts) | **Create** | onMessage handler hook |
| [`src/features/notifications/hooks/usePushNotifications.ts`](src/features/notifications/hooks/usePushNotifications.ts) | **Delete** | Split into useFcmToken + useForegroundMessages + NotificationContext |
| [`src/features/notifications/services/notificationService.ts`](src/features/notifications/services/notificationService.ts) | Modify | Keep IndexedDB helpers, remove VAPID subscribe/unsubscribe |
| [`src/features/notifications/components/NotificationBanner.tsx`](src/features/notifications/components/NotificationBanner.tsx) | Modify | Extend type color/icon map |
| [`src/features/notifications/components/NotificationCenter.tsx`](src/features/notifications/components/NotificationCenter.tsx) | Modify | Add filter tabs, pagination, per-filter empty states |
| [`src/features/notifications/components/PermissionPrompt.tsx`](src/features/notifications/components/PermissionPrompt.tsx) | No change | Works as-is with new hook |
| [`src/services/types.ts`](src/services/types.ts) | Modify | Add INotificationsService + NotificationPage |
| [`src/services/index.ts`](src/services/index.ts) | Modify | Add notifications service key, import mock/real |
| [`src/services/mock/notificationsService.ts`](src/services/mock/notificationsService.ts) | **Create** | Mock notifications service |
| [`src/services/real/notificationsService.ts`](src/services/real/notificationsService.ts) | **Create** | Real notifications service (API client) |
| [`src/state/NotificationContext.tsx`](src/state/NotificationContext.tsx) | **Create** | NotificationProvider + context |
| [`src/state/AppProviders.tsx`](src/state/AppProviders.tsx) | Modify | Add NotificationProvider to tree |
| [`src/hooks/useNotifications.ts`](src/hooks/useNotifications.ts) | **Create** | Consumer hook for NotificationContext |
| `src/features/notifications/hooks/__tests__/useNotificationPermission.test.ts` | **Create** | Permission hook tests |
| `src/features/notifications/hooks/__tests__/useFcmToken.test.ts` | **Create** | FCM token hook tests |
| `src/features/notifications/hooks/__tests__/useForegroundMessages.test.ts` | **Create** | Foreground message hook tests |
| `src/features/notifications/components/__tests__/NotificationBanner.test.tsx` | **Create** | Banner component tests |
| `src/features/notifications/components/__tests__/NotificationCenter.test.tsx` | **Create** | Center component tests |
| `src/features/notifications/components/__tests__/PermissionPrompt.test.tsx` | **Create** | Prompt component tests |
| `src/state/__tests__/NotificationContext.test.tsx` | **Create** | Provider integration tests |
| `src/services/mock/__tests__/notificationsService.test.ts` | **Create** | Mock service tests |
| `src/services/real/__tests__/notificationsService.test.ts` | **Create** | Real service tests |

---

## Appendix B: Migration Path from VAPID to FCM

```
Step 1: Add FCM infrastructure (firebase.ts, SW, env vars)
   └── No behavioral change yet — old VAPID code still runs

Step 2: Add service layer (INotificationsService, mock/real, service key)
   └── No behavioral change — not wired to UI yet

Step 3: Create new hooks (useFcmToken, useForegroundMessages)
   └── Side-by-side with usePushNotifications — not wired to UI

Step 4: Create NotificationProvider
   └── Wires new hooks + service → context

Step 5: Wire UI to NotificationProvider
   └── NotificationBanner, NotificationCenter now use context

Step 6: Remove old code
   └── Delete usePushNotifications.ts, sw-push-handler.js
   └── Remove VAPID-specific code from notificationService.ts

Step 7: Tests + typecheck
   └── Verify everything works end-to-end
```

---

## Appendix C: Sequence Diagram — FCM Token Flow

```
Driver App                Firebase FCM          Backend API
    │                         │                     │
    │──requestPermission()──>│                     │
    │<──granted──────────────│                     │
    │                         │                     │
    │──getToken(messaging)──>│                     │
    │<──fcm_token_string─────│                     │
    │                         │                     │
    │──registerToken(token)───────────────────────>│
    │<──200 OK─────────────────────────────────────│
    │                         │                     │
    │──subscribeToTopic(driver_xyz)───────────────>│
    │<──200 OK─────────────────────────────────────│
    │                         │                     │
    │   [token refresh event] │                     │
    │<──onTokenRefresh────────│                     │
    │──registerToken(new)─────────────────────────>│
    │<──200 OK─────────────────────────────────────│
    │                         │                     │
    │   [sign out / revoke permission]              │
    │──unregisterToken(token)─────────────────────>│
    │──deleteToken(messaging)>│                     │
    │<──200 OK─────────────────────────────────────│