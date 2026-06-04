import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import { useAuth } from '../state/AuthContext'

export default function Otp() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { login } = useAuth()
  const { state } = useLocation() as { state?: { phone?: string; code?: string } }
  const phone = '+91 ' + (state?.phone || '98765 43210')

  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')
  const complete = code.length === 4

  function setAt(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[i] = d
      return next
    })
    if (d && i < 3) refs.current[i + 1]?.focus()
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  function verify() {
    login(state?.phone || '98765 43210')
    nav('/home', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <TopBar title={t('otp.title')} back fallbackTo="/login" />
      <div className="flex-1 px-5 pt-6">
        <p className="text-ink-muted text-[15px]">
          {t('otp.subtitle', { phone })}
        </p>

        <div className="flex gap-3 justify-center mt-8">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              autoFocus={i === 0}
              inputMode="numeric"
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className={`h-16 w-14 text-center text-2xl font-extrabold nums bg-surface-grey outline-none transition-all rounded-xl ring-1 ring-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 focus:shadow-glow ${d ? 'text-accent' : 'text-ink'
                }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-accent font-black animate-pulse">
            {state?.code ? `💡 OTP Code is ${state.code}` : t('otp.hint')}
          </span>
          <button className="text-sm font-black text-accent hover:underline">{t('otp.resend')}</button>
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full disabled={!complete} onClick={verify}>
          {t('otp.verify')}
        </Button>
      </div>
    </div>
  )
}
