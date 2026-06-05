interface Props {
  on: boolean
  onChange: (v: boolean) => void
}

/** Large, finger-friendly online/offline switch (status is described alongside it). */
export default function Toggle({ on, onChange }: Props) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative flex h-8 w-[54px] shrink-0 items-center rounded-xl border p-[3px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${on ? 'border-success bg-success' : 'border-hairline bg-surface-grey'
        }`}
    >
      <span
        className={`h-6 w-6 rounded-lg border border-hairline bg-surface shadow-sm transition-transform duration-200 ${on ? 'translate-x-5 border-white/40' : 'translate-x-0'
          }`}
      />
    </button>
  )
}

