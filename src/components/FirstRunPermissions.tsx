import { useState } from 'react'
import { MapPin, Bell, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'
import { NOTIFICATION_PERMISSION_KEY } from '../features/notifications/types'

// One-time, first-launch permission request. Asks for FOREGROUND location and
// notifications up front (like most consumer apps). Background location is NOT
// requested here — Google Play requires it to be asked in-context, which the
// trip screen's staged disclosure already handles.
const FLAG = 'ht_perms_onboarded'
const isNative = Capacitor.isNativePlatform()

async function requestLocation(): Promise<void> {
  try {
    if (isNative) {
      await Geolocation.requestPermissions()
    } else if (navigator.geolocation) {
      await new Promise<void>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          () => resolve(),
          { timeout: 8000 },
        ),
      )
    }
  } catch {
    // User can still grant later from the trip screen.
  }
}

async function requestNotifications(): Promise<void> {
  try {
    if (isNative) {
      // Drives the Android 13+ POST_NOTIFICATIONS runtime dialog.
      await LocalNotifications.requestPermissions()
    } else if ('Notification' in window && typeof Notification.requestPermission === 'function') {
      await Notification.requestPermission()
    }
  } catch {
    // Non-critical.
  }
  // Mark notifications as prompted so the post-login push prompt doesn't re-ask.
  try {
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, String(Date.now()))
  } catch {
    // localStorage unavailable — ignore.
  }
}

export function FirstRunPermissions() {
  const { t } = useTranslation()
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(FLAG) === null
    } catch {
      return false
    }
  })
  const [busy, setBusy] = useState(false)

  if (!show) return null

  const finish = () => {
    try {
      localStorage.setItem(FLAG, '1')
    } catch {
      // ignore
    }
    setShow(false)
  }

  const handleAllow = async () => {
    setBusy(true)
    // Sequential so the OS shows one dialog at a time.
    await requestLocation()
    await requestNotifications()
    setBusy(false)
    finish()
  }

  return (
    <div className="absolute inset-0 z-[2000] flex items-end justify-center bg-black/40">
      <div className="w-full max-w-app bg-surface rounded-t-3xl border-t border-hairline shadow-pop p-6 pb-8 safe-bottom animate-slide-up">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-lg font-black text-ink">{t('perms.title', 'Enable permissions')}</h2>
        <p className="text-sm font-bold text-ink-muted mt-1">
          {t('perms.subtitle', 'HindTrucks needs a couple of permissions to track your trips and keep you updated.')}
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-grey flex items-center justify-center text-accent shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-ink">{t('perms.locationTitle', 'Location')}</p>
              <p className="text-xs font-bold text-ink-muted">
                {t('perms.locationDesc', 'Live GPS tracking, routing and accurate ETAs for your trips.')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-grey flex items-center justify-center text-accent shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-ink">{t('perms.notifTitle', 'Notifications')}</p>
              <p className="text-xs font-bold text-ink-muted">
                {t('perms.notifDesc', 'New load matches, trip updates and payment alerts.')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAllow}
          disabled={busy}
          className="mt-6 w-full py-3 rounded-xl bg-accent text-white font-black active:scale-[0.99] transition-transform disabled:opacity-50"
        >
          {busy ? t('perms.requesting', 'Requesting…') : t('perms.allow', 'Allow permissions')}
        </button>
        <button onClick={finish} disabled={busy} className="mt-2 w-full py-2.5 text-sm font-bold text-ink-muted">
          {t('perms.later', 'Not now')}
        </button>
      </div>
    </div>
  )
}
