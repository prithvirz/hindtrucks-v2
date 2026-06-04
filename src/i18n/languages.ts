// Registry of supported languages. Adding a new one = add an entry here,
// create its JSON file, and register it in i18n/index.ts.

export type LangCode = 'en' | 'hi' | 'pa' | 'ta' | 'te'

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
  { code: 'en', nativeName: 'English', englishName: 'English', regions: [] },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', regions: ['IN-UP', 'IN-DL', 'IN-MP', 'IN-BR', 'IN-RJ', 'IN-HR', 'IN-JH', 'IN-CT', 'IN-UT'] },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', regions: ['IN-PB', 'IN-CH'] },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', regions: ['IN-TN', 'IN-PY'] },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', regions: ['IN-AP', 'IN-TG'] },
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

  // Direct language-tag matches (e.g. "ta-IN", "pa", "te-IN")
  if (lower.startsWith('hi')) return 'hi'
  if (lower.startsWith('pa')) return 'pa'
  if (lower.startsWith('ta')) return 'ta'
  if (lower.startsWith('te')) return 'te'
  if (lower.startsWith('en-in') || lower.endsWith('-in')) return 'hi'

  return 'en'
}

/** Languages ordered so the region-suggested one is first. */
export function orderedLanguages(suggested: LangCode): Language[] {
  const top = LANGUAGES.filter((l) => l.code === suggested)
  const rest = LANGUAGES.filter((l) => l.code !== suggested)
  return [...top, ...rest]
}
