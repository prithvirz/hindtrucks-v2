import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import { useAuth } from '../state/AuthContext'
import { authService } from '../services'

export default function Otp() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { verifyOtp, isLoading, error } = useAuth()
  const { state } = useLocation() as { state?: { phone?: string } }
  const phone = state?.phone

  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(30)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!phone) nav('/login', { replace: true })
  }, [phone, nav])

  useEffect(() => {
    inputRef.current?.focus()
    const tick = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(tick)
  }, [])

  const complete = /^\d{6}$/.test(code)

  async function verify() {
    if (!complete || !phone) return
    try {
      await verifyOtp(phone, code)
      nav('/home', { replace: true })
    } catch {
      // error surfaced via context
    }
  }

  async function resend() {
    if (!phone || seconds > 0) return
    try {
      await authService.sendOtp({ phone: `+91${phone}` })
      setSeconds(30)
    } catch {
      // ignore — user can retry
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <TopBar title={t('otp.title')} back fallbackTo="/login" />
      <div className="flex-1 px-5 pt-6">
        <p className="text-ink-muted text-[15px]">
          {t('otp.subtitle', { phone })}
        </p>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="mt-8 h-16 w-full text-center text-3xl font-extrabold nums tracking-[0.5em] bg-surface-grey outline-none transition-all rounded-xl ring-1 ring-hairline focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40 focus:shadow-glow text-ink placeholder:text-ink-faint placeholder:tracking-[0.4em]"
        />

        {error && <p className="mt-3 text-sm font-bold text-danger">{error.message}</p>}

        <div className="flex items-center justify-end mt-6">
          <button
            disabled={seconds > 0}
            onClick={resend}
            className="text-sm font-black text-accent hover:underline disabled:text-ink-faint disabled:no-underline"
          >
            {seconds > 0 ? t('otp.resendIn', { seconds }) : t('otp.resend')}
          </button>
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full disabled={!complete} loading={isLoading} onClick={verify}>
          {t('otp.verify')}
        </Button>
      </div>
    </div>
  )
}
