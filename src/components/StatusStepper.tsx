import { Check } from 'lucide-react'

interface Props {
  steps: string[]
  /** number of completed steps (1..steps.length). The next one is "current". */
  current: number
}

export default function StatusStepper({ steps, current }: Props) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        const last = i === steps.length - 1
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  done
                    ? 'bg-success text-white'
                    : active
                      ? 'bg-accent text-white ring-4 ring-accent-soft'
                      : 'bg-surface-grey text-ink-faint'
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              {!last && (
                <span
                  className={`w-0.5 grow my-1 rounded ${
                    done ? 'bg-success' : 'bg-hairline'
                  }`}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            <div className={`pb-6 pt-1 ${last ? 'pb-0' : ''}`}>
              <p
                className={`text-[15px] font-semibold ${
                  done || active ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {label}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
