import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Flag, Navigation, Phone, Star, Truck } from 'lucide-react'
import { Button, formatRupees, formatDistance } from '@hindtrucks/shared'
import { bookingService } from '../services'
import type { Booking } from '../services'
import { useBookings } from '../state/BookingsContext'
import TopBar from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'

export default function BookingDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cancelBooking } = useBookings()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    bookingService.getBooking(id).then(setBooking).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="app-x py-10 text-center text-ink-muted">{error}</div>
  if (!booking) return <div className="app-x py-10 text-center text-ink-muted">{t('common.loading')}</div>

  const trackable = booking.status === 'accepted' || booking.status === 'in_transit'
  const balance = booking.price - booking.advance

  const onCancel = async () => {
    if (!window.confirm(t('detail.cancelConfirm'))) return
    await cancelBooking(booking.id)
    setBooking({ ...booking, status: 'cancelled' })
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={`#${booking.id}`} back right={<StatusBadge status={booking.status} />} />
      <div className="app-scroll app-x flex-1 pb-action">
        <img src={booking.image} alt="" className="h-40 w-full rounded-2xl object-cover" />

        {/* Route */}
        <h2 className="mb-2 mt-5 text-sm font-bold text-ink-muted">{t('detail.route')}</h2>
        <div className="rounded-2xl border border-hairline bg-surface p-4">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <MapPin className="h-4 w-4 text-success" />
              <div className="my-1 w-px flex-1 bg-hairline" />
              <Flag className="h-4 w-4 text-ink" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="font-extrabold text-ink">{booking.fromCity}</div>
                <div className="text-xs text-ink-muted">{booking.fromArea}</div>
              </div>
              <div>
                <div className="font-extrabold text-ink">{booking.toCity}</div>
                <div className="text-xs text-ink-muted">{booking.toArea}</div>
              </div>
            </div>
            <div className="text-right text-xs font-bold text-info">{formatDistance(booking.distanceKm)}</div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3 text-xs font-semibold text-ink-muted">
            <Truck className="h-4 w-4" /> {booking.truckType} · {booking.weightTon} {t('common.ton')} · {t(`goods.${booking.goods}`)}
          </div>
        </div>

        {/* Payment */}
        <h2 className="mb-2 mt-5 text-sm font-bold text-ink-muted">{t('detail.payment')}</h2>
        <div className="rounded-2xl border border-hairline bg-surface p-4 text-sm">
          <Row label={t('detail.total')} value={formatRupees(booking.price)} strong />
          <Row label={t('detail.advance')} value={formatRupees(booking.advance)} />
          <Row label={t('detail.balance')} value={formatRupees(balance)} />
        </div>

        {/* Driver */}
        <h2 className="mb-2 mt-5 text-sm font-bold text-ink-muted">{t('detail.driver')}</h2>
        {booking.driver ? (
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg font-extrabold text-accent">
              {booking.driver.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold text-ink">{booking.driver.name}</div>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {booking.driver.rating}
                </span>
                <span>· {booking.driver.truckReg}</span>
              </div>
            </div>
            <a
              href={`tel:${booking.driver.phone}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white"
              aria-label={t('detail.callDriver')}
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
            {t('detail.noDriver')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="app-x safe-bottom border-t border-hairline bg-surface-grey/90 pt-3 backdrop-blur">
        {trackable ? (
          <Button full size="xl" leftIcon={<Navigation className="h-5 w-5" />} onClick={() => navigate(`/track/${booking.id}`)}>
            {t('bookings.track')}
          </Button>
        ) : booking.status === 'available' ? (
          <Button full size="xl" variant="outline" onClick={onCancel}>
            {t('detail.cancel')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-ink-muted">{label}</span>
      <span className={`nums ${strong ? 'text-base font-extrabold text-ink' : 'font-bold text-ink'}`}>{value}</span>
    </div>
  )
}
