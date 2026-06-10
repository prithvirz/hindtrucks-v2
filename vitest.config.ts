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