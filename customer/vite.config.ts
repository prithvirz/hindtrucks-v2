import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Customer (shipper) app. Mirrors the driver app's build but standalone.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Absolute base so deep links / refreshes (e.g. /bookings/:id, /track/:id)
    // resolve assets from the web root instead of the route path. Matches the
    // driver app and works in both hosting (with SPA rewrites) and Capacitor.
    base: '/',
    plugins: [
      react(),
      VitePWA({
        // The demo build ships inside the Capacitor APK; a service worker there
        // causes stale-cache white screens across app updates. Ship a
        // self-destroying SW for demo so any old SW unregisters + clears caches.
        selfDestroying: mode === 'demo',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'HindTrucks — Book a Truck',
          short_name: 'HindTrucks',
          description: 'Book trucks for your shipments',
          theme_color: '#F26A1B',
          background_color: '#EAECF0',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          lang: 'en',
        },
      }),
    ],
    define: {
      'import.meta.env.VITE_API_MODE': JSON.stringify(env.VITE_API_MODE || 'mock'),
    },
    server: {
      host: true,
      port: process.env.PORT ? parseInt(process.env.PORT) : 5175,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('leaflet')) return 'leaflet'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor'
            if (id.includes('i18next')) return 'i18n'
            if (id.includes('lucide-react')) return 'icons'
          },
        },
      },
    },
  }
})
