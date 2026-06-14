import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, ArrowRight, Navigation } from 'lucide-react'
import { formatRupees } from '@hindtrucks/shared'
import type { Booking } from '../services'
import StatusBadge from './StatusBadge'

export default function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trackable = booking.status === 'accepted' || booking.status === 'in_transit'

  return (
    <button
      onClick={() => navigate(`/bookings/${booking.id}`)}
      className="block w-full text-left bg-surface boxed-border boxed-rounded boxed-shadow-sm boxed-btn-active overflow-hidden"
    >
      <div className="flex items-stretch">
        <img src={booking.image} alt="" className="h-auto w-24 shrink-0 object-cover" />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-ink-faint">#{booking.id}</span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="truncate">{booking.fromCity}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="truncate">{booking.toCity}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="nums text-base font-extrabold text-ink">{formatRupees(booking.price)}</span>
            {trackable && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-info">
                <Navigation className="h-3.5 w-3.5" />
                {t('bookings.track')}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
