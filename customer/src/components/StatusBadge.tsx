import { useTranslation } from 'react-i18next'
import type { LoadStatus } from '../services'

const STYLES: Record<LoadStatus, string> = {
  available: 'bg-accent-soft text-accent',
  accepted: 'bg-info-soft text-info',
  in_transit: 'bg-info-soft text-info',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-surface-sunken text-ink-faint',
}

export default function StatusBadge({ status }: { status: LoadStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${STYLES[status]}`}>
      {t(`status.${status}`)}
    </span>
  )
}
