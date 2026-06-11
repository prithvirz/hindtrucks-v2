/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
    readonly VITE_API_MODE: 'mock' | 'real' | 'hybrid'
    readonly VITE_API_AUTH: 'mock' | 'real' | ''
    readonly VITE_API_LOADS: 'mock' | 'real' | ''
    readonly VITE_API_TRIP: 'mock' | 'real' | ''
    readonly VITE_API_EARNINGS: 'mock' | 'real' | ''
    readonly VITE_API_PROFILE: 'mock' | 'real' | ''
    readonly VITE_API_CHAT: 'mock' | 'real' | ''
    readonly VITE_API_NOTIFICATIONS: 'mock' | 'real' | ''
    readonly VITE_API_BASE_URL: string
    readonly VITE_USE_EMULATOR: string
    readonly VITE_ORS_API_KEY: string
    readonly VITE_FCM_VAPID_KEY: string
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly VITE_FIREBASE_MEASUREMENT_ID: string
    readonly VITE_FIREBASE_MESSAGING_VAPID_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// ── Vite define-block global constants ──
declare const __VITE_FIREBASE_API_KEY__: string;
declare const __VITE_FIREBASE_AUTH_DOMAIN__: string;
declare const __VITE_FIREBASE_PROJECT_ID__: string;
declare const __VITE_FIREBASE_STORAGE_BUCKET__: string;
declare const __VITE_FIREBASE_MESSAGING_SENDER_ID__: string;
declare const __VITE_FIREBASE_APP_ID__: string;
declare const __VITE_FIREBASE_MEASUREMENT_ID__: string;
declare const __VITE_FCM_VAPID_KEY__: string;
