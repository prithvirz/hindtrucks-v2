import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Truck, Wallet, ShieldCheck } from 'lucide-react'
import { images } from '../lib/assets'
import { useAuth } from '../state/AuthContext'
import Button from '../components/Button'
import AppLogo from '../components/AppLogo'

export default function Splash() {
  const nav = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { isLoggedIn } = useAuth()

  const state = location.state as { immediateLanding?: boolean } | undefined
  const [showLanding, setShowLanding] = useState(!!state?.immediateLanding)
  const [loading, setLoading] = useState(!state?.immediateLanding)

  useEffect(() => {
    if (state?.immediateLanding) {
      return
    }
    // Show splash animation for 1.5s
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        nav('/home', { replace: true })
      } else {
        setLoading(false)
        setShowLanding(true)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [nav, isLoggedIn, state])

  return (
    <div className="relative h-full w-full bg-night-900 overflow-hidden flex flex-col justify-between">
      <img
        src={images.splashHighway}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night-900/20 via-night-900/60 to-night-900/95" />

      {/* Main Branding Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center transition-all duration-500">
        <div className={`transition-all duration-700 transform ${showLanding ? '-translate-y-6 scale-90' : 'translate-y-0'}`}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-base border-2 border-accent shadow-accent animate-scale-in">
            <AppLogo size={52} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            {t('app.name')}
          </h1>
          <p className="mt-2 text-white/80 text-[15px] font-medium tracking-wide">
            {t('splash.tagline')}
          </p>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute bottom-12 flex gap-1.5 transition-opacity duration-300">
            <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-white/50 animate-pulse [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-white/30 animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Slide-up Welcome / Get Started Dashboard Card */}
      {showLanding && (
        <div className="relative p-6 bg-white/10 backdrop-blur-lg border border-white/10 rounded-t-[32px] animate-slide-up shadow-2xl flex flex-col gap-5 z-10 select-none">
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />

          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">
              Driver Application
            </h2>
            <p className="text-white/60 text-xs mt-1 font-semibold">
              Logistics and load matching simplified
            </p>
          </div>

          {/* Quick value props */}
          <div className="flex flex-col gap-3.5 my-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                <Truck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">High-Paying Verified Loads</p>
                <p className="text-[10px] font-semibold text-white/50">Direct load matching near your location</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Earn and Instant Withdrawals</p>
                <p className="text-[10px] font-semibold text-white/50">Receive payouts directly to your bank account</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Bharat Freight Club Elite Benefits</p>
                <p className="text-[10px] font-semibold text-white/50">Exclusive leaderboards and bonus incentives</p>
              </div>
            </div>
          </div>

          {/* Big Get Started Button */}
          <Button
            full
            variant="primary"
            onClick={() => nav('/language')}
            rightIcon={<ArrowRight size={18} />}
            className="shadow-accent group py-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started
          </Button>
        </div>
      )}
    </div>
  )
}

