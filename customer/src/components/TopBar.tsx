import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  back?: boolean
  right?: ReactNode
}

export default function TopBar({ title, back, right }: Props) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-10 bg-surface-grey/90 backdrop-blur">
      <div className="app-x flex h-14 items-center gap-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface-sunken"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className="flex-1 truncate text-lg font-extrabold text-ink">{title}</h1>
        {right}
      </div>
    </header>
  )
}
