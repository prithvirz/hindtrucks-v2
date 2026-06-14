import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Eagerly bundle every locale JSON — switching is a pure in-memory swap.
const localeModules = import.meta.glob('./*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>

const resources: Record<string, { translation: Record<string, unknown> }> = {}
for (const path in localeModules) {
  const code = path.replace('./', '').replace('.json', '')
  resources[code] = { translation: localeModules[path].default }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'htc_lang',
      caches: ['localStorage'],
    },
  })

export default i18n
