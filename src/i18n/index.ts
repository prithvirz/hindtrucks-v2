import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ht_lang',
      caches: ['localStorage'],
    },
    // Load non-English locales lazily via dynamic import
    partialBundledLanguages: true,
  })

// Register lazy-loaded locale bundles
// Each non-English locale is loaded on-demand when the user switches to it
i18n.on('languageChanged', (lng) => {
  if (lng === 'en') return
  import(`./${lng}.json`)
    .then((mod) => {
      i18n.addResourceBundle(lng, 'translation', mod.default || mod, true, true)
    })
    .catch(() => {
      console.warn(`[i18n] Failed to load locale bundle for "${lng}"`)
    })
})

// Override changeLanguage to preload lazy-loaded translation files synchronously/awaitable
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
(i18n as any).changeLanguage = async (lng: string, ...args: any[]) => {
  if (lng && lng !== 'en' && !i18n.hasResourceBundle(lng, 'translation')) {
    try {
      const mod = await import(`./${lng}.json`)
      i18n.addResourceBundle(lng, 'translation', mod.default || mod, true, true)
    } catch (err) {
      console.warn(`[i18n] Failed to load locale bundle for "${lng}"`, err)
    }
  }
  return originalChangeLanguage(lng, ...args)
}

export default i18n
