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
      className={`relative flex items-center h-8 w-[56px] shrink-0 rounded-full boxed-border p-[2px] transition-colors duration-200 focus:outline-none ${
        on ? 'bg-success' : 'bg-surface-grey'
      }`}
    >
      <span
        className={`h-[24px] w-[24px] rounded-full boxed-border bg-white transition-transform duration-200 ${
          on ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}


