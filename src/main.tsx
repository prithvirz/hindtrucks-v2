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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
