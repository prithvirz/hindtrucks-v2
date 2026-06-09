import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import { images } from '../lib/assets'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { sendOtp, isLoading, error } = useAuth()
  const [phone, setPhone] = useState('')

  const valid = phone.replace(/\D/g, '').length === 10

  async function handleLogin() {
    const cleaned = phone.replace(/\D/g, '')
    try {
      await sendOtp(cleaned, 'login')
      nav('/otp', { state: { phone: cleaned, intent: 'login' } })
    } catch {
      // error displayed via auth context error state
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="relative h-44 shrink-0">
        <img src={images.truckSide} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
      </div>

      <div className="flex-1 px-5 pt-3">
        <h1 className="text-2xl font-extrabold text-ink leading-snug">{t('login.title')}</h1>
        <p className="text-ink-muted mt-1 text-[15px]">{t('login.subtitle')}</p>

        <label className="block mt-6 text-xs font-black uppercase text-ink-muted">
          {t('login.phoneLabel')}
        </label>
        <div className="mt-2 flex items-center gap-2 h-14 rounded-xl bg-surface-grey ring-1 ring-hairline px-4 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 focus-within:shadow-glow transition-all">
          <Phone size={18} className="text-ink-faint" />
          <span className="text-ink font-bold nums">+91</span>
          <input
            autoFocus
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            data-testid="phone-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 11))}
            className="flex-1 bg-transparent outline-none text-ink text-[17px] font-bold tracking-wide placeholder:text-ink-faint placeholder:font-semibold [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 font-semibold">{error.message}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted font-bold">
          <ShieldCheck size={15} className="text-success" />
          <span>{t('login.terms')}</span>
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full disabled={!valid || isLoading} onClick={handleLogin}>
          {isLoading ? t('gps.requesting') : t('login.continue')}
        </Button>
      </div>
    </div>
  )
}
