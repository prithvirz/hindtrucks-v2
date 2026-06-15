import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Truck } from 'lucide-react'
import { Button } from '@hindtrucks/shared'
import { RECAPTCHA_CONTAINER_ID } from '@hindtrucks/shared/firebase'
import { authService } from '../services'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const digits = phone.replace(/\D/g, '')
  const valid = digits.length === 10

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const full = `+91${digits}`
      await authService.sendOtp({ phone: full })
      navigate('/otp', { state: { phone: full } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="app-x safe-top-padding flex flex-1 flex-col justify-center">
        <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent shadow-accent">
          <Truck className="h-9 w-9 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-extrabold text-ink">{t('login.title')}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">{t('login.subtitle')}</p>

        <label className="mt-7 block text-xs font-bold text-ink-muted">{t('login.phoneLabel')}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-hairline bg-surface px-3.5 focus-within:border-accent">
          <span className="text-base font-bold text-ink-muted">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('login.phonePlaceholder')}
            className="h-14 flex-1 bg-transparent text-lg font-bold tracking-wide text-ink outline-none placeholder:text-ink-faint placeholder:font-medium"
          />
        </div>
        {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
      </div>

      <div id={RECAPTCHA_CONTAINER_ID} />

      <div className="app-x safe-bottom pt-2">
        <Button full size="xl" disabled={!valid} loading={busy} onClick={submit}>
          {t('login.sendOtp')}
        </Button>
        <p className="mt-3 text-center text-xs text-ink-faint">{t('login.terms')}</p>
      </div>
    </div>
  )
}
