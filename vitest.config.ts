import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@capacitor/core': path.resolve(__dirname, 'src/__tests__/stubs/capacitor-core.ts'),
            '@capacitor/app-launcher': path.resolve(__dirname, 'src/__tests__/stubs/capacitor-app-launcher.ts'),
        },
    },
    define: {
        __VITE_SENTRY_DSN__: JSON.stringify(''),
        __VITE_APP_VERSION__: JSON.stringify('0.0.0'),
        __VITE_API_MODE__: JSON.stringify('mock'),
        __VITE_FIREBASE_API_KEY__: JSON.stringify(''),
        __VITE_FIREBASE_AUTH_DOMAIN__: JSON.stringify(''),
        __VITE_FIREBASE_PROJECT_ID__: JSON.stringify(''),
        __VITE_FIREBASE_STORAGE_BUCKET__: JSON.stringify(''),
        __VITE_FIREBASE_MESSAGING_SENDER_ID__: JSON.stringify(''),
        __VITE_FIREBASE_APP_ID__: JSON.stringify(''),
        __VITE_FIREBASE_MEASUREMENT_ID__: JSON.stringify(''),
        __VITE_FCM_VAPID_KEY__: JSON.stringify(''),
    },
    test: {
        globals: true,
        environment: 'jsdom',
        css: false,
        env: {
            VITE_API_MODE: 'mock',
            VITE_API_AUTH: 'mock',
            VITE_API_LOADS: 'mock',
            VITE_API_TRIP: 'mock',
            VITE_API_EARNINGS: 'mock',
            VITE_API_PROFILE: 'mock',
            VITE_API_CHAT: 'mock',
            VITE_API_NOTIFICATIONS: 'mock',
            VITE_FCM_VAPID_KEY: 'test-vapid-key',
            VITE_FIREBASE_API_KEY: '',
            VITE_FIREBASE_AUTH_DOMAIN: '',
            VITE_FIREBASE_PROJECT_ID: '',
            VITE_FIREBASE_STORAGE_BUCKET: '',
            VITE_FIREBASE_MESSAGING_SENDER_ID: '',
            VITE_FIREBASE_APP_ID: '',
            VITE_FIREBASE_MEASUREMENT_ID: '',
            VITE_FIREBASE_MESSAGING_VAPID_KEY: '',
        },
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'e2e'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/__tests__/**',
                'src/vite-env.d.ts',
                'src/main.tsx',
            ],
        },
    },
})