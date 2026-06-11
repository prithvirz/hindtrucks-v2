import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { initSentry } from './lib/sentry'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './i18n'

initSentry()

// A failed lazy-chunk import (stale service worker after a deploy, flaky
// network) would otherwise white-screen the app — reload to fetch fresh chunks.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

if (Capacitor.getPlatform() === 'android') {
  void SystemBars.show({ animation: 'NONE' })
    .then(() => SystemBars.setStyle({ style: SystemBarsStyle.Light }))
    .catch(() => {
      // Web fallback keeps the app usable if SystemBars is unavailable.
    })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)
