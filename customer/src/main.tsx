import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'

// Demo/APK diagnostic: surface uncaught errors on-screen instead of a white
// screen (the Capacitor WebView can't be remote-inspected easily). Mock only.
if (import.meta.env.VITE_API_MODE === 'mock') {
  const show = (label: string, msg: string) => {
    let el = document.getElementById('__diag')
    if (!el) {
      el = document.createElement('pre')
      el.id = '__diag'
      el.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;margin:0;padding:14px;background:#fff;color:#b00020;font:12px/1.4 monospace;white-space:pre-wrap;overflow:auto'
      document.body.appendChild(el)
    }
    el.textContent += `[${label}] ${msg}\n\n`
  }
  window.addEventListener('error', (e) =>
    show('error', (e.error && e.error.stack) || e.message || String(e)),
  )
  window.addEventListener('unhandledrejection', (e) =>
    show('promise', (e.reason && (e.reason.stack || e.reason.message)) || String(e.reason)),
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
