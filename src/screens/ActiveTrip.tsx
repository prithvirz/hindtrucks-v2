import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, ArrowRight, PartyPopper, Navigation } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import StatusStepper from '../components/StatusStepper'
import RouteMap from '../components/RouteMap'
import { LiveMap } from '../features/tracking/components/LiveMap'
import { LocationPermission } from '../features/tracking/components/LocationPermission'
import { GeofenceAlert } from '../features/tracking/components/GeofenceAlert'
import { useTrip } from '../state/TripContext'
import { useProfile } from '../state/ProfileContext'
import { useEarnings } from '../state/EarningsContext'
import { inr } from '../lib/format'
import type { RouteWaypoint } from '../features/tracking/types'

export default function ActiveTrip() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { role, drivers, driver, refreshProfile } = useProfile()
  const { refreshEarnings } = useEarnings()
  const {
    activeLoad,
    tripStep,
    advanceTrip,
    resetTrip,
    activeTrips,
    advanceTripOwner,
    resetTripOwner,
    trackingState,
    startTracking,
    stopTracking,
  } = useTrip()

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  if (role === 'owner' && !selectedTripId) {
    return (
      <div className="h-full flex flex-col">
        <TopBar title="Fleet Tracking" />
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-32 space-y-4">
          <p className="text-xs font-black uppercase text-ink-muted">Ongoing Fleet Trips ({activeTrips.length})</p>

          {activeTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Navigation size={36} className="text-ink-faint animate-bounce" />
              <p className="mt-3 text-ink-muted font-black">No ongoing trips in your fleet right now.</p>
              <Button className="mt-5" variant="ghost" onClick={() => nav('/loads')}>
                Search & Assign Loads
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeTrips.map((trip) => {
                const tk = driver.trucks.find(t => t.id === trip.truckId || t.regNumber === trip.truckId)
                const drv = drivers.find(d => d.id === trip.driverId)
                const steps = ['Booked', 'Loaded', 'Transit', 'Arrived']
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className="p-4 bg-surface rounded-[24px] border border-hairline shadow-card active:scale-[0.99] transition-all cursor-pointer text-left flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-accent" />
                    
                    <div className="flex justify-between items-start pl-1.5">
                      <div>
                        <span className="text-[10px] font-black uppercase text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent">
                          {tk?.regNumber || trip.truckId}
                        </span>
                        <p className="text-xs text-ink-muted font-bold mt-1.5">
                          Driver: {drv?.name || 'Self'} • Goods: {trip.load.goods}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-ink leading-tight nums">{inr(trip.load.price)}</p>
                        <p className="text-[10px] text-ink-faint mt-1 font-bold">Tap to track &rarr;</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-ink font-extrabold pl-1.5 border-t border-hairline pt-2.5">
                      <span className="truncate">{trip.load.fromCity}</span>
                      <span className="text-ink-faint font-normal">&rarr;</span>
                      <span className="truncate">{trip.load.toCity}</span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 mt-1 border-t border-hairline/25 pt-2 pl-1.5">
                      {steps.map((st, idx) => {
                        const stepNum = idx + 1
                        const isDone = trip.step >= stepNum
                        const isCurrent = trip.step === stepNum
                        return (
                          <div key={st} className="flex-1 flex flex-col items-center">
                            <div className={`h-2.5 w-full rounded-full transition-colors ${
                              isCurrent ? 'bg-accent animate-pulse' : isDone ? 'bg-success' : 'bg-ink/10'
                            }`} />
                            <span className={`text-[9px] font-black mt-1 leading-none ${
                              isCurrent ? 'text-accent' : isDone ? 'text-success' : 'text-ink-faint'
                            }`}>
                              {st}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  const activeTrip = role === 'owner'
    ? activeTrips.find(t => t.id === selectedTripId)
    : activeLoad ? { id: 't_self', load: activeLoad, step: tripStep } : null

  if (!activeTrip) {
    return (
      <div className="h-full flex flex-col">
        <TopBar title={t('trip.title')} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <Navigation size={36} className="text-ink-faint" />
          <p className="mt-3 text-ink-muted">{t('home.noNearby')}</p>
          <Button className="mt-5" variant="ghost" onClick={() => nav('/loads')}>
            {t('loads.title')}
          </Button>
        </div>
      </div>
    )
  }

  const tripId = activeTrip.id
  const currentLoad = activeTrip.load
  const currentStep = activeTrip.step
  const isComplete = currentStep >= 4

  const stepKeys = ['toPickup', 'loaded', 'transit', 'delivered'] as const
  const steps = stepKeys.map((k) => t(`trip.steps.${k}`))
  const done = currentStep

  function finish() {
    if (role === 'owner') {
      resetTripOwner(tripId)
      setSelectedTripId(null)
    } else {
      localStorage.setItem('ht_first_trip_done_' + driver.phone, '1')
      stopTracking()
      resetTrip()
      refreshProfile()
      refreshEarnings()
      nav('/home', { replace: true })
    }
  }

  function handleAdvance() {
    if (role === 'owner') {
      advanceTripOwner(tripId)
    } else {
      advanceTrip()
    }
  }

  const waypoints: RouteWaypoint[] = [
    {
      id: `pickup-${currentLoad.id}`,
      coordinates: { lat: 28.6139, lng: 77.209, timestamp: Date.now() },
      label: `${currentLoad.fromCity}, ${currentLoad.fromArea}`,
      type: 'pickup',
      geofenceRadius: 200,
      triggered: false,
    },
    {
      id: `drop-${currentLoad.id}`,
      coordinates: { lat: 26.9124, lng: 75.7873, timestamp: Date.now() },
      label: `${currentLoad.toCity}, ${currentLoad.toArea}`,
      type: 'drop',
      geofenceRadius: 200,
      triggered: false,
    },
  ]

  const routeCoords = waypoints.map((wp) => wp.coordinates)
  const { geofenceStatus } = trackingState

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={role === 'owner' ? `Trip Detail: ${currentLoad.id}` : t('trip.title')}
        back={role === 'owner'}
        onBack={role === 'owner' ? () => setSelectedTripId(null) : undefined}
      />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        <div className="relative h-48">
          <LocationPermission
            onGranted={() => {
              if (!trackingState.isTracking) {
                startTracking(waypoints, routeCoords)
              }
            }}
            onDenied={() => {
            }}
          >
            {trackingState.isTracking && trackingState.driverPosition ? (
              <LiveMap
                driverPosition={trackingState.driverPosition}
                route={routeCoords}
                waypoints={waypoints}
                height="100%"
              />
            ) : (
              <RouteMap progress={currentStep / 4} />
            )}

            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-2xl bg-surface/85 border border-hairline backdrop-blur-md px-3.5 py-2.5 shadow-lg">
              <span className="font-bold text-ink text-sm">{currentLoad.fromCity}</span>
              <ArrowRight size={14} className="text-accent" />
              <span className="font-bold text-ink text-sm">{currentLoad.toCity}</span>
              <span className="ml-auto text-xs text-ink-muted nums">
                {currentLoad.distanceKm} {t('common.km')}
              </span>
            </div>
          </LocationPermission>

          {geofenceStatus.justEntered && geofenceStatus.nearestWaypoint && geofenceStatus.distanceToNext !== null && (
            <GeofenceAlert
              waypoint={geofenceStatus.nearestWaypoint}
              distance={geofenceStatus.distanceToNext}
              onDismiss={() => { }}
            />
          )}
        </div>

        <div className="px-5 pt-5">
          {isComplete ? (
            <div className="rounded-2xl bg-success-soft ring-1 ring-success/20 p-6 text-center animate-scale-in">
              <PartyPopper size={36} className="mx-auto text-success" />
              <p className="mt-3 text-lg font-extrabold text-ink">{role === 'owner' ? 'Trip Fully Delivered!' : t('trip.completed')}</p>
              
              {role === 'driver' && localStorage.getItem(`ht_first_trip_done_${driver.phone}`) !== '1' && driver.phone !== '+91 98765 43210' ? (
                <>
                  <p className="text-xs text-ink-muted mt-1">First Trip Settlement (Signup Bonus Adjusted):</p>
                  <div className="my-3 py-2.5 px-3.5 bg-surface-sunken rounded-xl text-left text-xs font-bold text-ink-muted space-y-1.5 border border-success/20 max-w-[260px] mx-auto">
                    <div className="flex justify-between">
                      <span>Trip Payout:</span>
                      <span className="nums text-ink">{inr(currentLoad.price)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>Signup Bonus Adjusted:</span>
                      <span className="nums font-black">-{inr(1500)}</span>
                    </div>
                    <div className="border-t border-hairline my-1"></div>
                    <div className="flex justify-between text-success font-black text-sm">
                      <span>Net Added to Wallet:</span>
                      <span className="nums">{inr(currentLoad.price - 1500)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-faint font-semibold max-w-[220px] mx-auto leading-normal">
                    The ₹1,500 bonus already credited to your account upon signup has been settled against this first trip.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-muted mt-1">{role === 'owner' ? 'Payment released to your wallet:' : t('trip.earned')}</p>
                  <p className="text-3xl font-extrabold text-success mt-1 nums">{inr(currentLoad.price)}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-surface shadow-card border border-hairline p-4 flex items-center gap-3 mb-5">
                <div className="flex-1">
                  <p className="text-[11px] text-ink-faint">{t('loadDetail.shipper')}</p>
                  <p className="font-bold text-ink leading-tight">{currentLoad.shipperName}</p>
                </div>
                <Button size="sm" variant="secondary" leftIcon={<Phone size={16} />}>
                  {t('trip.callShipper')}
                </Button>
              </div>

              <StatusStepper steps={steps} current={done} />
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/90 border-t border-hairline backdrop-blur-xl safe-bottom z-10">
        {isComplete ? (
          <Button full variant="dark" onClick={finish}>
            {role === 'owner' ? 'Back to Fleet List' : t('trip.backHome')}
          </Button>
        ) : (
          <Button full onClick={handleAdvance}>
            {role === 'owner' ? `Advance Driver Stage (${steps[done] ?? steps[steps.length - 1]})` : t('trip.markNext', { step: steps[done] ?? steps[steps.length - 1] })}
          </Button>
        )}
      </div>
    </div>
  )
}
