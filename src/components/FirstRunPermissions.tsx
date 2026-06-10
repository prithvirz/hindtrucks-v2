import { useEffect, useState } from 'react'
import { MapPin, Bell, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import type { PermissionState } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { LocalNotifications } from '@capacitor/local-notifications'
import { openLocationSettings } from '../features/tracking/services/backgroundLocation'
import { NOTIFICATION_PERMISSION_KEY } from '../features/notifications/types'

// One-time, first-launch permission request. Asks for FOREGROUND location and
// notifications up front (like most consumer apps). Background location is NOT
// requested here — Google Play requires it to be asked in-context, which the
// trip screen's staged disclosure already handles.
const FLAG = 'ht_perms_onboarded'
const isNative = Capacitor.isNativePlatform()

function normalizeLocationState(state: PermissionState): PermissionState {
  return state === 'prompt-with-rationale' ? 'prompt' : state
}

async function checkLocationPermission(): Promise<PermissionState> {
  try {
    if (isNative) {
      const { location } = await Geolocation.checkPermissions()
      return normalizeLocationState(location)
    }

    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      return result.state
    }
  } catch {
    return 'prompt'
  }

  return 'prompt'
}

async function requestLocation(): Promise<PermissionState> {
  try {
    if (isNative) {
      const { location } = await Geolocation.requestPermissions({ permissions: ['location'] })
      return normalizeLocationState(location)
    } else if (navigator.geolocation) {
      return await new Promise<PermissionState>((resolve) =>
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt'),
          { timeout: 8000 },
        ),
      )
    }
  } catch {
    // User can still grant later from this prompt or the trip screen.
  }

  return 'prompt'
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
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function decidePromptVisibility() {
      // Short-circuit: if the flag is already set (from a previous run,
      // a native permissions grant, or E2E test setup), skip the async
      // permission probe and hide the overlay immediately.
      try {
        if (localStorage.getItem(FLAG) === '1') {
          setShow(false)
          setChecked(true)
          return
        }
      } catch {
        // localStorage unavailable — fall through to permission check
      }

      const locationState = await checkLocationPermission()
      if (cancelled) return

      if (locationState === 'granted') {
        try {
          localStorage.setItem(FLAG, '1')
        } catch {
          // ignore
        }
        setShow(false)
      } else {
        setShow(true)
        setDenied(locationState === 'denied')
      }
      setChecked(true)
    }

    decidePromptVisibility()

    return () => {
      cancelled = true
    }
  }, [])

  if (!checked || !show) return null

  const finish = (locationGranted: boolean) => {
    try {
      if (locationGranted) {
        localStorage.setItem(FLAG, '1')
      } else {
        localStorage.removeItem(FLAG)
      }
    } catch {
      // ignore
    }
    setShow(false)
  }

  const handleAllow = async () => {
    setBusy(true)
    // Sequential so the OS shows one dialog at a time.
    const locationState = await requestLocation()
    await requestNotifications()
    setBusy(false)
    setDenied(locationState === 'denied')
    finish(locationState === 'granted')
  }

  return (
    <div className="absolute inset-0 z-[2000] flex items-end justify-center bg-black/40">
      <div className="w-full max-w-app bg-surface rounded-t-3xl border-t border-hairline shadow-pop p-6 pb-8 safe-bottom animate-slide-up">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-lg font-black text-ink">{t('perms.title', 'Enable permissions')}</h2>
        <p className="text-sm font-bold text-ink-muted mt-1">
          {denied
            ? t('perms.locationDenied', 'Location permission is blocked. Please allow it from your phone settings, then come back.')
            : t('perms.subtitle', 'HindTrucks needs a couple of permissions to track your trips and keep you updated.')}
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
        {denied && isNative && (
          <button
            onClick={() => openLocationSettings().catch(() => undefined)}
            disabled={busy}
            className="mt-2 w-full py-3 rounded-xl bg-surface-grey text-ink font-black border border-hairline active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            {t('gps.openSettings', 'Open Settings')}
          </button>
        )}
        <button onClick={() => finish(false)} disabled={busy} className="mt-2 w-full py-2.5 text-sm font-bold text-ink-muted">
          {t('perms.later', 'Not now')}
        </button>
      </div>
    </div>
  )
}
