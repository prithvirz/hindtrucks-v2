import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  back?: boolean
  right?: ReactNode
  onBack?: () => void
}

export default function TopBar({ title, back, right, onBack }: Props) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur-xl border-b border-hairline">
      <div className="h-14 flex items-center gap-2 px-3">
        {back && (
          <button
            onClick={onBack || (() => nav(-1))}
            className="h-10 w-10 -ml-1 flex items-center justify-center rounded-xl bg-surface-grey hover:bg-surface-sunken active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-[17px] font-extrabold text-ink truncate flex-1">{title}</h1>
        {right}
      </div>
    </header>
  )
}
