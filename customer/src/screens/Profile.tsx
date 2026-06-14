import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, LogOut } from 'lucide-react'
import { Button, Card, orderedLanguages, suggestedLangForRegion, type LangCode } from '@hindtrucks/shared'
import { profileService } from '../services'
import type { ShipperProfile } from '../services'
import { useAuth } from '../state/AuthContext'
import TopBar from '../components/TopBar'

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { phone, logout } = useAuth()

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState(false)

  useEffect(() => {
    let alive = true
    void profileService.getProfile().then((p) => {
      if (!alive) return
      setName(p.name)
      setCompany(p.company ?? '')
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  const save = async () => {
    const profile: ShipperProfile = { name: name.trim(), phone: phone ?? '', company: company.trim() || undefined }
    await profileService.saveProfile(profile)
    setSavedAt(true)
    setTimeout(() => setSavedAt(false), 1800)
  }

  const langs = orderedLanguages(suggestedLangForRegion())
  const current = i18n.language as LangCode

  const chooseLang = (code: LangCode) => {
    void i18n.changeLanguage(code)
    localStorage.setItem('htc_lang', code)
  }

  const doLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t('profile.title')} />

      <div className="app-scroll app-x flex-1 space-y-4 pb-4">
        <Card>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-ink-muted">{t('profile.name')}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                placeholder={t('profile.name')}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-ink-muted">{t('profile.company')}</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                placeholder={t('profile.company')}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-ink-muted">{t('profile.phone')}</span>
              <div className="mt-1 w-full rounded-xl border border-hairline bg-surface-sunken px-3 py-2.5 text-sm text-ink-muted">
                {phone || '—'}
              </div>
            </label>
            <Button full onClick={save} disabled={!loaded}>
              {savedAt ? t('profile.saved') : t('common.save')}
            </Button>
          </div>
        </Card>

        <Card>
          <span className="text-xs font-bold text-ink-muted">{t('profile.language')}</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {langs.map((lang) => {
              const active = lang.code === current
              return (
                <button
                  key={lang.code}
                  onClick={() => chooseLang(lang.code)}
                  className={`relative rounded-xl border p-2.5 text-left transition-all ${
                    active ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface'
                  }`}
                >
                  {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-accent" />}
                  <div className="text-sm font-extrabold text-ink">{lang.nativeName}</div>
                  <div className="text-[11px] text-ink-muted">{lang.englishName}</div>
                </button>
              )
            })}
          </div>
        </Card>

        <button
          onClick={doLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface py-3 text-sm font-bold text-red-500"
        >
          <LogOut className="h-4 w-4" />
          {t('profile.logout')}
        </button>
      </div>
    </div>
  )
}
