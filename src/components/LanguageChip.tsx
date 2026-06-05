import { Check } from 'lucide-react'
import type { Language } from '../i18n/languages'

interface Props {
  lang: Language
  selected: boolean
  suggested?: boolean
  suggestedLabel?: string
  onClick: () => void
}

export default function LanguageChip({
  lang,
  selected,
  suggested,
  suggestedLabel,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl p-4 ring-1 transition-all active:scale-[0.99] ${selected ? 'bg-accent-soft ring-accent shadow-glow' : 'bg-surface ring-hairline shadow-xs hover:bg-surface-grey'
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[18px] font-bold text-ink leading-tight">{lang.nativeName}</p>
          {lang.nativeName !== lang.englishName && (
            <p className="text-xs text-ink-muted mt-0.5 font-bold">{lang.englishName}</p>
          )}
        </div>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${selected ? 'bg-accent text-white' : 'bg-surface-base ring-1 ring-hairline'
            }`}
        >
          {selected && <Check size={14} strokeWidth={3} />}
        </span>
      </div>
      {suggested && (
        <span className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wide text-accent bg-surface px-2 py-0.5 rounded-full ring-1 ring-accent/40">
          {suggestedLabel}
        </span>
      )}
    </button>
  )
}

