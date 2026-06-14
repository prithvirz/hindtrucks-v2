import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Read .env / .env.local (dotenv populates import.meta.env, not process.env),
  // so VITE_API_MODE set in .env.local is honoured by the define below.
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      workbox: {
        importScripts: ['/sw-push-handler.js'],
      },
      manifest: {
        name: 'HindTrucks Driver',
        short_name: 'HindTrucks',
        description: 'Find loads, drive, earn — the driver app for HindTrucks.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_API_MODE': JSON.stringify(env.VITE_API_MODE || 'mock'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
    __BUNDLED_DEV__: 'false',
    __SERVER_FORWARD_CONSOLE__: 'false',
  },
  server: { host: true, allowedHosts: true },
  // The shared package is consumed as source via @fs, so `firebase/firestore` is
  // discovered late and triggers a mid-session re-optimize. That splits the
  // singleton @firebase/app registry (firestore component ends up on a different
  // app instance than getFirestore queries) → "Service firestore is not available".
  // Pre-declaring the entry points forces Vite to bundle them in the first pass.
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore'],
  },
  resolve: { dedupe: ['firebase', '@firebase/app'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react'
          }
          if (id.includes('i18next') || id.includes('react-i18next') || id.includes('i18next-browser-languagedetector')) {
            return 'i18n'
          }
          if (id.includes('lucide-react')) {
            return 'icons'
          }
        },
      },
    },
  },
  }
})
