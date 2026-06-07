import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import { useAuth } from '../state/AuthContext'

export default function Otp() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { verifyOtp, isLoading, error } = useAuth()
  const { state } = useLocation() as { state?: { phone?: string } }
  const rawPhone = state?.phone || '9876543210'
  const displayPhone = '+91 ' + rawPhone

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join('')
  const complete = code.length === 6

  function setAt(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[i] = d
      return next
    })
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  function onPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
      e.preventDefault()
    }
  }

  async function verify() {
    try {
      await verifyOtp(rawPhone, code)
      nav('/home', { replace: true })
    } catch {
      // error shown from auth context
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <TopBar title={t('otp.title')} back fallbackTo="/login" />
      <div className="flex-1 px-5 pt-6">
        <p className="text-ink-muted text-[15px]">
          {t('otp.subtitle', { phone: displayPhone })}
        </p>

        <div className="flex gap-2 justify-center mt-8">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              value={d}
              autoFocus={i === 0}
              inputMode="numeric"
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={onPaste}
              className={`h-16 w-12 text-center text-2xl font-extrabold nums bg-surface-grey outline-none transition-all rounded-xl ring-1 ring-hairline focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40 focus:shadow-glow [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] ${d ? 'text-accent' : 'text-ink'}`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500 font-semibold">{error.message}</p>
        )}

        <div className="flex justify-end mt-6">
          <button className="text-sm font-black text-accent hover:underline">{t('otp.resend')}</button>
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full disabled={!complete || isLoading} onClick={verify}>
          {isLoading ? t('gps.requesting') : t('otp.verify')}
        </Button>
      </div>
    </div>
  )
}
