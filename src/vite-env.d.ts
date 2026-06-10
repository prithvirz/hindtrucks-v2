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
    readonly VITE_API_BASE_URL: string
    readonly VITE_USE_EMULATOR: string
    readonly VITE_ORS_API_KEY: string
    readonly VITE_VAPID_PUBLIC_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
