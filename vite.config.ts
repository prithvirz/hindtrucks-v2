import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => ({
  plugins: [
    // Dev-only HTTPS so phones on the LAN can use geolocation (browsers block
    // it on plain http). Skipped in 'http' mode for local tooling that can't handle self-signed certs.
    ...(mode === 'development' || mode === 'https' ? [basicSsl()] : []),
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
    'import.meta.env.VITE_API_MODE': JSON.stringify(process.env.VITE_API_MODE || 'mock'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api'),
    'import.meta.env.VITE_USE_EMULATOR': JSON.stringify(process.env.VITE_USE_EMULATOR || 'false'),
    __BUNDLED_DEV__: 'false',
    __SERVER_FORWARD_CONSOLE__: 'false',
  },
  server: { host: true, allowedHosts: true, port: process.env.PORT ? parseInt(process.env.PORT) : undefined },
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
}))
