import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PhoneFrame } from '@hindtrucks/shared'
import { AuthProvider, useAuth } from './state/AuthContext'
import { BookingsProvider } from './state/BookingsContext'
import BottomTabBar from './components/BottomTabBar'
import Splash from './screens/Splash'
import LanguagePicker from './screens/LanguagePicker'
import Login from './screens/Login'
import Otp from './screens/Otp'
import NewBooking from './screens/NewBooking'
import Bookings from './screens/Bookings'
import BookingDetail from './screens/BookingDetail'
import TrackShipment from './screens/TrackShipment'
import Profile from './screens/Profile'

const TAB_ROUTES = ['/book', '/bookings', '/profile']

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoggedIn, ready } = useAuth()
  if (!ready) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Shell() {
  const location = useLocation()
  const showTabs = TAB_ROUTES.includes(location.pathname)
  return (
    <PhoneFrame>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/language" element={<LanguagePicker />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/book" element={<RequireAuth><NewBooking /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />
          <Route path="/bookings/:id" element={<RequireAuth><BookingDetail /></RequireAuth>} />
          <Route path="/track/:id" element={<RequireAuth><TrackShipment /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {showTabs && <BottomTabBar />}
      </div>
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <BookingsProvider>
          <Shell />
        </BookingsProvider>
      </AuthProvider>
    </HashRouter>
  )
}
