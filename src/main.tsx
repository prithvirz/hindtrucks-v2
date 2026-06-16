import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './i18n'

// Demo/APK diagnostic: the Capacitor WebView can't be remote-inspected easily,
// so surface any uncaught error on-screen instead of a white screen. Mock build
// only (the APK ships mock mode); a no-op in real/firebase builds.
if (import.meta.env.VITE_API_MODE === 'mock') {
  const show = (label: string, msg: string) => {
    let el = document.getElementById('__diag')
    if (!el) {
      el = document.createElement('pre')
      el.id = '__diag'
      // Non-blocking bottom banner (tap to dismiss) so a non-fatal error never
      // hides a working app; on a true white screen it's still visible.
      el.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;max-height:40vh;z-index:2147483647;margin:0;padding:12px;background:rgba(255,255,255,0.97);color:#b00020;font:11px/1.4 monospace;white-space:pre-wrap;overflow:auto;border-top:2px solid #b00020'
      el.onclick = () => el && el.remove()
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
