import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  back?: boolean
  right?: ReactNode
  onBack?: () => void
  fallbackTo?: string
}

export default function TopBar({ title, back, right, onBack, fallbackTo }: Props) {
  const nav = useNavigate()
  const location = useLocation()
  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }
    if (fallbackTo && location.key === 'default') {
      nav(fallbackTo, { replace: true })
      return
    }
    nav(-1)
  }

  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl border-b border-hairline safe-top">
      <div className="min-h-14 flex items-center gap-2 app-x py-1.5">
        {back && (
          <button
            onClick={handleBack}
            className="min-h-11 min-w-11 -ml-2 flex items-center justify-center rounded-xl bg-surface-grey hover:bg-surface-sunken active:scale-95 transition-all"
            aria-label="Back"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-[17px] font-extrabold text-ink truncate flex-1 leading-tight">{title}</h1>
        {right}
      </div>
    </header>
  )
}
