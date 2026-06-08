import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogIn, UserPlus } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'

export default function AuthChoice() {
  const nav = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col bg-surface">
      <TopBar title={t('auth.title', 'Start')} back fallbackTo="/language" />

      <div className="flex-1 px-5 pt-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-ink leading-tight">
            {t('auth.heading', 'Welcome to HindTrucks')}
          </h1>
          <p className="text-ink-muted text-[15px] font-semibold">
            {t('auth.subtitle', 'New drivers can register. Existing drivers can login with the same number.')}
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => nav('/register')}
            className="w-full rounded-2xl border border-accent bg-accent/10 p-4 text-left shadow-card active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-accent text-white flex items-center justify-center">
                <UserPlus size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-ink">{t('auth.registerTitle', 'Register')}</p>
                <p className="text-xs font-bold text-ink-muted mt-0.5">
                  {t('auth.registerSubtitle', 'First time on HindTrucks')}
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => nav('/login')}
            className="w-full rounded-2xl border border-hairline bg-surface-grey p-4 text-left shadow-card active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-surface text-ink flex items-center justify-center border border-hairline">
                <LogIn size={20} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-black text-ink">{t('auth.loginTitle', 'Login')}</p>
                <p className="text-xs font-bold text-ink-muted mt-0.5">
                  {t('auth.loginSubtitle', 'Already registered')}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="p-5 border-t border-hairline safe-bottom">
        <Button full onClick={() => nav('/register')} rightIcon={<UserPlus size={17} />}>
          {t('auth.primaryCta', 'Register')}
        </Button>
      </div>
    </div>
  )
}
