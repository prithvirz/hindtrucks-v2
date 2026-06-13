import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus, Inbox } from 'lucide-react'
import { Button } from '@hindtrucks/shared'
import { useBookings } from '../state/BookingsContext'
import TopBar from '../components/TopBar'
import BookingCard from '../components/BookingCard'

const ACTIVE = new Set(['available', 'accepted', 'in_transit'])

export default function Bookings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bookings, loading } = useBookings()
  const [tab, setTab] = useState<'active' | 'past'>('active')

  const filtered = bookings.filter((b) => (tab === 'active' ? ACTIVE.has(b.status) : !ACTIVE.has(b.status)))

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={t('bookings.title')}
        right={
          <button
            onClick={() => navigate('/book')}
            className="flex h-9 items-center gap-1 rounded-full bg-accent px-3 text-xs font-bold text-white"
          >
            <PackagePlus className="h-4 w-4" />
            {t('bookings.newBooking')}
          </button>
        }
      />

      <div className="app-x mb-3 flex gap-2">
        {(['active', 'past'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`h-9 flex-1 rounded-full text-sm font-bold transition-colors ${
              tab === key ? 'bg-ink text-white' : 'bg-surface-sunken text-ink-muted'
            }`}
          >
            {t(`bookings.${key}`)}
          </button>
        ))}
      </div>

      <div className="app-scroll app-x flex-1 pb-tabs">
        {loading && bookings.length === 0 ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 boxed-rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-sunken">
              <Inbox className="h-8 w-8 text-ink-faint" />
            </div>
            <p className="mt-4 font-bold text-ink">{t('bookings.empty')}</p>
            <p className="mt-1 text-sm text-ink-muted">{t('bookings.emptyHint')}</p>
            <div className="mt-5">
              <Button onClick={() => navigate('/book')}>{t('bookings.newBooking')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
