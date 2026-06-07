import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

// Tab roots: hardware/gesture back on these does not pop history.
const TAB_ROOTS = ['/home', '/loads', '/earnings', '/profile']

// Wire the Android hardware/gesture back button into in-app navigation.
// Default Capacitor behaviour exits the app on every back press; instead we
// pop the SPA history, fall back to a tab root, and only exit from /home.
export function useAndroidBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let remove: (() => void) | undefined
    App.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.pathname

      if (TAB_ROOTS.includes(path)) {
        // From a secondary tab go to Home; from Home, leave the app.
        if (path !== '/home') navigate('/home')
        else App.exitApp()
        return
      }

      // Detail / flow screens: pop history if possible, else go Home.
      if (canGoBack) navigate(-1)
      else navigate('/home')
    }).then((handle) => {
      remove = () => handle.remove()
    })

    return () => {
      remove?.()
    }
  }, [navigate])
}
