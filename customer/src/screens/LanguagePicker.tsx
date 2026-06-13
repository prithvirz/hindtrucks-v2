import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { orderedLanguages, suggestedLangForRegion, type LangCode } from '@hindtrucks/shared'
import { Button } from '@hindtrucks/shared'

export default function LanguagePicker() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const suggested = suggestedLangForRegion()
  const [selected, setSelected] = useState<LangCode>((i18n.language as LangCode) || suggested)
  const langs = orderedLanguages(suggested)

  const choose = (code: LangCode) => {
    setSelected(code)
    void i18n.changeLanguage(code)
  }

  const proceed = () => {
    localStorage.setItem('htc_lang', selected)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="app-x safe-top-padding pb-3">
        <h1 className="text-2xl font-extrabold text-ink">{t('language.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('language.subtitle')}</p>
      </div>
      <div className="app-scroll app-x flex-1 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {langs.map((lang) => {
            const active = lang.code === selected
            return (
              <button
                key={lang.code}
                onClick={() => choose(lang.code)}
                className={`relative rounded-2xl border p-3.5 text-left transition-all ${
                  active ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface'
                }`}
              >
                {active && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-accent" />}
                <div className="text-lg font-extrabold text-ink">{lang.nativeName}</div>
                <div className="text-xs text-ink-muted">{lang.englishName}</div>
                {lang.code === suggested && (
                  <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    {t('language.suggested')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="app-x safe-bottom pt-2">
        <Button full size="xl" onClick={proceed}>
          {t('common.continue')}
        </Button>
      </div>
    </div>
  )
}
