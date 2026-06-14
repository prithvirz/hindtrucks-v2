import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gauge, MapPinOff, Phone, Navigation } from 'lucide-react'
import { formatDistance } from '@hindtrucks/shared'
import { bookingService, trackingService } from '../services'
import type { Booking, TripStatus } from '../services'
import { lookupCity } from '../data/cityCoords'
import TopBar from '../components/TopBar'
import LiveMap from '../components/LiveMap'

export default function TrackShipment() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [status, setStatus] = useState<TripStatus | null>(null)

  useEffect(() => {
    if (!id) return
    bookingService.getBooking(id).then(setBooking).catch(() => {})
    const poll = () => trackingService.getTripStatus(id).then(setStatus).catch(() => {})
    poll()
    const timer = setInterval(poll, 4000)
    return () => clearInterval(timer)
  }, [id])

  const from = booking ? lookupCity(booking.fromCity) : null
  const to = booking ? lookupCity(booking.toCity) : null
  const truck = status?.position ? ([status.position.lat, status.position.lng] as [number, number]) : null
  const canMap = Boolean(from && to)

  const headline =
    status?.step === 0
      ? t('track.awaitingDriver')
      : status && status.step >= 4
        ? t('track.delivered')
        : t('track.driverEnRoute')

  const remainingKm = booking && status ? Math.round(booking.distanceKm * (1 - status.progress)) : null

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t('track.title')} back />
      <div className="relative flex-1">
        {canMap && from && to ? (
          <LiveMap from={from} to={to} truck={truck} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-surface-sunken text-center">
            <MapPinOff className="h-10 w-10 text-ink-faint" />
            <p className="mt-3 px-8 text-sm text-ink-muted">{t('track.noLocation')}</p>
          </div>
        )}

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <div className="pointer-events-auto rounded-2xl border border-hairline bg-surface/95 p-4 shadow-pop backdrop-blur">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-accent" />
              <span className="font-extrabold text-ink">{headline}</span>
            </div>

            {status && status.step > 0 && status.step < 4 && (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.round(status.progress * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-ink-muted">
                  {remainingKm !== null && <span>{formatDistance(remainingKm)} left</span>}
                  {status.position?.speed != null && (
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" /> {t('track.speed', { speed: Math.round(status.position.speed) })}
                    </span>
                  )}
                </div>
              </>
            )}

            {status?.driver && (
              <div className="mt-3 flex items-center gap-3 border-t border-hairline pt-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-extrabold text-accent">
                  {status.driver.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-extrabold text-ink">{status.driver.name}</div>
                  <div className="truncate text-xs text-ink-muted">{status.driver.truckReg}</div>
                </div>
                <a href={`tel:${status.driver.phone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white">
                  <Phone className="h-5 w-5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
