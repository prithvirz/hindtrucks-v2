import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../components/Button'
import LanguageChip from '../components/LanguageChip'
import {
  orderedLanguages,
  suggestedLangForRegion,
  type LangCode,
} from '../i18n/languages'

export default function LanguagePicker() {
  const nav = useNavigate()
  const { t, i18n } = useTranslation()

  const suggested = useMemo(() => suggestedLangForRegion(), [])
  const ordered = useMemo(() => orderedLanguages(suggested), [suggested])

  const [selected, setSelected] = useState<LangCode>(
    (i18n.language?.slice(0, 2) as LangCode) || suggested,
  )
  const [switching, setSwitching] = useState(false)

  async function choose(code: LangCode) {
    setSelected(code)
    setSwitching(true)
    await i18n.changeLanguage(code)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setSwitching(false)
  }

  async function onContinue() {
    setSwitching(true)
    await i18n.changeLanguage(selected)
    nav('/login')
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 safe-top-padding pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink">{t('language.title')}</h1>
          <p className="text-ink-muted mt-1 text-[15px]">{t('language.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-3">
          {ordered.map((lang) => (
            <LanguageChip
              key={lang.code}
              lang={lang}
              selected={selected === lang.code}
              suggested={lang.code === suggested}
              suggestedLabel={t('language.suggested')}
              onClick={() => choose(lang.code)}
            />
          ))}
        </div>
      </div>

      <div className="p-5 border-t border-hairline bg-surface safe-bottom">
        <Button full onClick={onContinue}>
          {t('common.continue')}
        </Button>
      </div>

      {/* Premium language switcher loader overlay */}
      {switching && (
        <div className="absolute inset-0 z-50 bg-overlay backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in select-none">
          <div className="bg-surface p-6 rounded-2xl shadow-pop flex flex-col items-center gap-3 border border-hairline">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs font-black text-ink uppercase tracking-wider">Changing Language...</p>
          </div>
        </div>
      )}
    </div>
  )
}

