import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, User } from 'lucide-react'
import Button from '../components/Button'
import TopBar from '../components/TopBar'
import { useAuth } from '../state/AuthContext'
import { useProfile } from '../state/ProfileContext'

export default function Register() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { isLoggedIn, phone: verifiedPhone, registrationStatus, sendOtp, isLoading, error } = useAuth()
  const { createDriverProfile, isLoading: profileLoading, error: profileError } = useProfile()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const isVerifiedUnregistered = isLoggedIn && registrationStatus === 'unregistered' && !!verifiedPhone
  const cleanedPhone = isVerifiedUnregistered ? verifiedPhone : phone.replace(/\D/g, '')
  const valid = name.trim().length >= 3 && cleanedPhone.length === 10
  const busy = isLoading || profileLoading

  async function handleRegister() {
    if (!valid) return
    try {
      if (isVerifiedUnregistered) {
        await createDriverProfile({ name: name.trim(), phone: cleanedPhone })
        nav('/home', { replace: true })
        return
      }
      await sendOtp(cleanedPhone, 'register')
      nav('/otp', {
        state: {
          phone: cleanedPhone,
          intent: 'register',
          name: name.trim(),
        },
      })
    } catch {
      // error displayed via auth context
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <TopBar title={t('register.title')} back fallbackTo="/auth" />

      <div className="flex-1 px-5 pt-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-ink leading-tight">{t('register.welcomeTitle')}</h1>
          <p className="text-ink-muted text-[15px] font-semibold">
            {t('register.welcomeSubtitle')}
          </p>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted">
              {t('register.fullName')}
            </label>
            <div className="mt-2 flex items-center gap-2 h-14 rounded-xl bg-surface-grey ring-1 ring-hairline px-4 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
              <User size={18} className="text-ink-faint" />
              <input
                autoFocus
                type="text"
                placeholder={t('register.fullNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-ink text-[16px] font-bold placeholder:text-ink-faint"
              />
            </div>
          </div>

          {!isVerifiedUnregistered && (
            <div>
              <label className="block text-xs font-black uppercase text-ink-muted">
                {t('login.phoneLabel')}
              </label>
              <div className="mt-2 flex items-center gap-2 h-14 rounded-xl bg-surface-grey ring-1 ring-hairline px-4 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                <Phone size={18} className="text-ink-faint" />
                <span className="text-ink font-bold nums">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, '').slice(0, 11))}
                  className="flex-1 bg-transparent outline-none text-ink text-[17px] font-bold tracking-wide placeholder:text-ink-faint placeholder:font-semibold"
                />
              </div>
            </div>
          )}

          {isVerifiedUnregistered && (
            <p className="text-xs text-ink-muted font-bold">
              {t('register.verifiedPhone', { phone: '+91 ' + verifiedPhone })}
            </p>
          )}

          {(error || profileError) && (
            <p className="text-sm text-red-500 font-semibold">{(error || profileError)?.message}</p>
          )}
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full disabled={!valid || busy} onClick={handleRegister}>
          {busy ? t('gps.requesting') : t('register.createAccount')}
        </Button>
      </div>
    </div>
  )
}
