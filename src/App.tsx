// HindTrucks v2 - deployed via Cloudflare Pages Git integration
import { Suspense, lazy, useState, useCallback, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AppProviders } from './state/AppProviders'
import { useAuth } from './state/AuthContext'
import { useShell } from './state/ShellContext'
import PhoneFrame from './components/PhoneFrame'
import BottomTabBar from './components/BottomTabBar'
import OnboardingTour from './components/OnboardingTour'
import AIChatbot from './components/AIChatbot'
import { OfflineIndicator } from './features/offline/components/OfflineIndicator'
import { PermissionPrompt } from './features/notifications/components/PermissionPrompt'
import { NotificationBanner } from './features/notifications/components/NotificationBanner'

const Splash = lazy(() => import('./screens/Splash'))
const LanguagePicker = lazy(() => import('./screens/LanguagePicker'))
const Login = lazy(() => import('./screens/Login'))
const Otp = lazy(() => import('./screens/Otp'))
const Home = lazy(() => import('./screens/Home'))
const Loads = lazy(() => import('./screens/Loads'))
const LoadDetail = lazy(() => import('./screens/LoadDetail'))
const ActiveTrip = lazy(() => import('./screens/ActiveTrip'))
const Earnings = lazy(() => import('./screens/Earnings'))
const Profile = lazy(() => import('./screens/Profile'))
const Register = lazy(() => import('./screens/Register'))

// Tabs that should show the bottom navigation bar.
const TAB_ROUTES = ['/home', '/loads', '/earnings', '/profile']

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isLoggedIn, phone } = useAuth()
  const isRegistered = phone === '98765 43210' || phone === '9876543210' || localStorage.getItem('ht_registered_' + phone) === '1'

  if (!isLoggedIn) {
    return <Navigate to="/language" replace />
  }
  if (!isRegistered) {
    return <Navigate to="/register" replace />
  }
  return children
}

function RequireRegistration({ children }: { children: JSX.Element }) {
  const { isLoggedIn, phone } = useAuth()
  const isRegistered = phone === '98765 43210' || phone === '9876543210' || localStorage.getItem('ht_registered_' + phone) === '1'

  if (!isLoggedIn) {
    return <Navigate to="/language" replace />
  }
  if (isRegistered) {
    return <Navigate to="/home" replace />
  }
  return children
}

function Shell() {
  const { pathname } = useLocation()
  const { isLoggedIn } = useAuth()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // Prompt the user to update when a new version is detected by the service worker
  useEffect(() => {
    if (needRefresh) {
      if (window.confirm('A new version of HindTrucks is available. Update now?')) {
        updateServiceWorker(true)
      } else {
        setNeedRefresh(false)
      }
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh])

  const {
    notification,
    dismissNotification,
    pushPermissionState,
    subscribeToPush,
    dismissPushPrompt,
    activePushBanner,
    dismissPushBanner,
  } = useShell()
  const showTabs = TAB_ROUTES.includes(pathname)

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  // Show permission prompt after login when needsPrompt is true
  const handlePermissionPromptDismiss = useCallback(() => {
    setShowPermissionPrompt(false)
    // Persist the dismissal so it respects the cooldown instead of re-prompting
    // on every reload/navigation.
    dismissPushPrompt()
  }, [dismissPushPrompt])

  const handlePermissionPromptEnable = useCallback(async (): Promise<boolean> => {
    const result = await subscribeToPush()
    setShowPermissionPrompt(false)
    return result
  }, [subscribeToPush])

  // Show push permission prompt when needsPrompt is true after login
  useEffect(() => {
    if (isLoggedIn && pushPermissionState.needsPrompt) {
      setShowPermissionPrompt(true)
    }
  }, [isLoggedIn, pushPermissionState.needsPrompt])

  // Only render the chatbot and tour on actual app dashboard screens, not setup/login flows
  const isAppScreen = !['/', '/language', '/login', '/otp', '/register'].includes(pathname)

  return (
    <PhoneFrame>
      <div id="phone-shell" className="h-full relative overflow-hidden">
        {/* Offline Indicator Banner */}
        <OfflineIndicator />

        {/* Push Notification Banner */}
        {activePushBanner && (
          <NotificationBanner
            notification={activePushBanner}
            onDismiss={dismissPushBanner}
            onTap={() => { }}
          />
        )}

        {/* Push Permission Prompt */}
        <PermissionPrompt
          visible={showPermissionPrompt}
          onEnable={handlePermissionPromptEnable}
          onDismiss={handlePermissionPromptDismiss}
        />

        {/* Mock Notification Banner System */}
        {notification && (
          <div
            onClick={dismissNotification}
            className="absolute top-4 inset-x-4 z-50 bg-surface-base/95 backdrop-blur border border-hairline rounded-2xl p-3.5 shadow-pop flex items-start gap-3 cursor-pointer animate-slide-down select-none"
          >
            <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0 border border-accent/15">
              {notification.type === 'sms' ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-black text-accent uppercase tracking-wider">
                  {notification.type === 'sms' ? '💬 Message' : '🔔 Notification'}
                </span>
                <span className="text-[9px] text-ink-faint font-bold">now</span>
              </div>
              <p className="text-[13px] font-black text-ink mt-0.5 leading-tight">{notification.title}</p>
              <p className="text-xs font-bold text-ink-muted mt-0.5 leading-normal">{notification.message}</p>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/language" element={<LanguagePicker />} />
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<Otp />} />
            <Route path="/register" element={<RequireRegistration><Register /></RequireRegistration>} />

            <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/loads" element={<RequireAuth><Loads /></RequireAuth>} />
            <Route path="/loads/:id" element={<RequireAuth><LoadDetail /></RequireAuth>} />
            <Route path="/trip" element={<RequireAuth><ActiveTrip /></RequireAuth>} />
            <Route path="/earnings" element={<RequireAuth><Earnings /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {showTabs && <BottomTabBar />}

        {/* Global Guided Onboarding Tour - only when logged in and on app screens */}
        {isLoggedIn && isAppScreen && <OnboardingTour />}

        {/* Global AI Chatbot Assistant - only when logged in and on main navigation tabs */}
        {isLoggedIn && showTabs && <AIChatbot />}
      </div>
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <AppProviders>
      <Shell />
    </AppProviders>
  )
}
