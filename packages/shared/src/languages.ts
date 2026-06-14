// Registry of supported languages, shared by both apps. Adding a new one =
// add an entry here and create its JSON file in each app's i18n folder.

export type LangCode = 'en' | 'hi' | 'pa' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'as'

export interface Language {
  code: LangCode
  /** Name written in the language's own script */
  nativeName: string
  /** English name, for the sub-label */
  englishName: string
  /** Indian states/regions where this language is primary */
  regions: string[]
}

export const LANGUAGES: Language[] = [
  // Top 5 (Always at the top)
  { code: 'en', nativeName: 'English', englishName: 'English', regions: [] },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', regions: ['IN-WB', 'IN-TR'] },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', regions: ['IN-UP', 'IN-DL', 'IN-MP', 'IN-BR', 'IN-RJ', 'IN-HR', 'IN-JH', 'IN-CT', 'IN-UT'] },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', regions: ['IN-PB', 'IN-CH'] },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', regions: ['IN-AP', 'IN-TG'] },

  // Others (Scrollable below the top 5)
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', regions: ['IN-TN', 'IN-PY'] },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', regions: ['IN-MH'] },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', regions: ['IN-GJ'] },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', regions: ['IN-KA'] },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', regions: ['IN-KL'] },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', regions: ['IN-OR'] },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', regions: ['IN-AS'] },
]

/**
 * Detect the user's region from the browser locale (best-effort) and return the
 * language code that should float to the TOP of the picker. Falls back to Hindi
 * for India, else English.
 */
export function suggestedLangForRegion(): LangCode {
  const locale =
    (typeof navigator !== 'undefined' &&
      (navigator.languages?.[0] || navigator.language)) ||
    'en'
  const lower = locale.toLowerCase()

  if (lower.startsWith('bn')) return 'bn'
  if (lower.startsWith('hi')) return 'hi'
  if (lower.startsWith('pa')) return 'pa'
  if (lower.startsWith('ta')) return 'ta'
  if (lower.startsWith('te')) return 'te'
  if (lower.startsWith('mr')) return 'mr'
  if (lower.startsWith('gu')) return 'gu'
  if (lower.startsWith('kn')) return 'kn'
  if (lower.startsWith('ml')) return 'ml'
  if (lower.startsWith('or')) return 'or'
  if (lower.startsWith('as')) return 'as'
  if (lower.startsWith('en-in') || lower.endsWith('-in')) return 'hi'

  return 'en'
}

/** Languages ordered so the region-suggested one is first. */
export function orderedLanguages(suggested: LangCode): Language[] {
  const top = LANGUAGES.filter((l) => l.code === suggested)
  const rest = LANGUAGES.filter((l) => l.code !== suggested)
  return [...top, ...rest]
}
