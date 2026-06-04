

import { useAuth } from './AuthContext'
import { useShell } from './ShellContext'
import { useProfile } from './ProfileContext'
import { useTrip } from './TripContext'
import { useEarnings } from './EarningsContext'
import { AppProviders } from './AppProviders'

// Re-export AppProviders as AppProvider for backward compatibility
export { AppProviders as AppProvider }

// Backward-compatible bridge — delegates to focused contexts
export function useApp() {
  const auth = useAuth()
  const trip = useTrip()
  const earnings = useEarnings()
  const profile = useProfile()
  const shell = useShell()

  return {
    // Auth
    isLoggedIn: auth.isLoggedIn,
    phone: auth.phone,
    login: auth.login,
    logout: auth.logout,
    // Trip
    activeLoad: trip.activeLoad,
    tripStep: trip.tripStep,
    acceptLoad: trip.acceptLoad,
    advanceTrip: trip.advanceTrip,
    resetTrip: trip.resetTrip,
    // Earnings
    payouts: earnings.payouts,
    withdrawWallet: earnings.withdrawWallet,
    // Profile — merge walletBalance back into driver for backward compat
    driver: { ...profile.driver, walletBalance: earnings.walletBalance },
    isOnline: profile.isOnline,
    setOnline: profile.setOnline,
    updateDriver: profile.updateDriver,
    addTruck: profile.addTruck,
    removeTruck: profile.removeTruck,
    setActiveTruck: profile.setActiveTruck,
    // Shell
    hasSeenTour: shell.hasSeenTour,
    isTourActive: shell.isTourActive,
    startTour: shell.startTour,
    endTour: shell.endTour,
    tourStep: shell.tourStep,
    setTourStep: shell.setTourStep,
    notification: shell.notification,
    showNotification: shell.showNotification,
    dismissNotification: shell.dismissNotification,
  }
}
