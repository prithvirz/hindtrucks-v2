import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      // Dev-only HTTPS so phones on the LAN can use geolocation (browsers block
      // it on plain http). Skipped in 'http' mode for local tooling that can't handle self-signed certs.
      ...(mode === 'development' || mode === 'https' ? [basicSsl()] : []),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-static-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/api\//i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/\/api\//, /\/__\/.*/],
        },
        manifest: {
          name: 'HindTrucks',
          short_name: 'HindTrucks',
          description: 'Truck driver logistics companion',
          theme_color: '#F26A1B',
          background_color: '#EAECF0',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          lang: 'en',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
      // Generate bundle size report on build (output: dist/stats.html)
      ...(mode === 'production' || mode === 'https'
        ? [visualizer({ open: false, gzipSize: true, brotliSize: true, filename: 'dist/stats.html' })]
        : []),
    ],
    define: {
      'import.meta.env.VITE_API_MODE': JSON.stringify(env.VITE_API_MODE || 'mock'),
      'import.meta.env.VITE_API_AUTH': JSON.stringify(env.VITE_API_AUTH || ''),
      'import.meta.env.VITE_API_LOADS': JSON.stringify(env.VITE_API_LOADS || ''),
      'import.meta.env.VITE_API_TRIP': JSON.stringify(env.VITE_API_TRIP || ''),
      'import.meta.env.VITE_API_EARNINGS': JSON.stringify(env.VITE_API_EARNINGS || ''),
      'import.meta.env.VITE_API_PROFILE': JSON.stringify(env.VITE_API_PROFILE || ''),
      'import.meta.env.VITE_API_CHAT': JSON.stringify(env.VITE_API_CHAT || ''),
      'import.meta.env.VITE_API_NOTIFICATIONS': JSON.stringify(env.VITE_API_NOTIFICATIONS || ''),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
      'import.meta.env.VITE_USE_EMULATOR': JSON.stringify(env.VITE_USE_EMULATOR || 'false'),
      'import.meta.env.VITE_ORS_API_KEY': JSON.stringify(env.VITE_ORS_API_KEY || ''),
      'import.meta.env.VITE_FCM_VAPID_KEY': JSON.stringify(env.VITE_FCM_VAPID_KEY || ''),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY': JSON.stringify(env.VITE_FIREBASE_MESSAGING_VAPID_KEY || ''),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID || ''),
      __VITE_SENTRY_DSN__: JSON.stringify(env.VITE_SENTRY_DSN || ''),
      __VITE_APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '0.0.0'),
      __VITE_API_MODE__: JSON.stringify(env.VITE_API_MODE || 'mock'),
      __VITE_FIREBASE_API_KEY__: JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
      __VITE_FIREBASE_AUTH_DOMAIN__: JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ''),
      __VITE_FIREBASE_PROJECT_ID__: JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
      __VITE_FIREBASE_STORAGE_BUCKET__: JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ''),
      __VITE_FIREBASE_MESSAGING_SENDER_ID__: JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      __VITE_FIREBASE_APP_ID__: JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
      __VITE_FIREBASE_MEASUREMENT_ID__: JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID || ''),
      __VITE_FCM_VAPID_KEY__: JSON.stringify(env.VITE_FCM_VAPID_KEY || ''),
      __BUNDLED_DEV__: 'false',
      __SERVER_FORWARD_CONSOLE__: 'false',
    },
    server: { host: true, allowedHosts: true, port: process.env.PORT ? parseInt(process.env.PORT) : undefined },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
            if (id.includes('leaflet')) return 'leaflet'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor'
            if (id.includes('i18next') || id.includes('react-i18next') || id.includes('i18next-browser-languagedetector')) return 'i18n'
            if (id.includes('lucide-react')) return 'icons'
          },
        },
      },
    },
  }
})
