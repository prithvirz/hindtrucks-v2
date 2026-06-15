import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@hindtrucks/shared'
import { authService } from '../services'
import { useAuth } from '../state/AuthContext'
import TopBar from '../components/TopBar'

export default function Otp() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const phone = (location.state as { phone?: string } | null)?.phone

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(30)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone, navigate])

  useEffect(() => {
    inputRef.current?.focus()
    const tick = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(tick)
  }, [])

  const valid = /^\d{6}$/.test(code)

  const verify = async () => {
    if (!valid || !phone) return
    setBusy(true)
    setError(null)
    try {
      await authService.verifyOtp({ phone, otp: code })
      login(phone)
      navigate('/book', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (seconds > 0 || !phone) return
    setError(null)
    try {
      await authService.sendOtp({ phone })
      setSeconds(30)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP')
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="" back />
      <div className="app-x flex flex-1 flex-col">
        <h1 className="text-2xl font-extrabold text-ink">{t('otp.title')}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">{t('otp.subtitle', { phone })}</p>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="mt-7 h-16 w-full rounded-xl border border-hairline bg-surface text-center text-3xl font-extrabold tracking-[0.5em] text-ink outline-none focus:border-accent placeholder:tracking-[0.4em] placeholder:text-ink-faint"
        />
        {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}

        <button
          disabled={seconds > 0}
          onClick={resend}
          className="mt-4 self-start text-sm font-bold text-accent disabled:text-ink-faint"
        >
          {seconds > 0 ? t('otp.resendIn', { seconds }) : t('otp.resend')}
        </button>
      </div>
      <div className="app-x safe-bottom pt-2">
        <Button full size="xl" disabled={!valid} loading={busy} onClick={verify}>
          {t('otp.verify')}
        </Button>
      </div>
    </div>
  )
}
