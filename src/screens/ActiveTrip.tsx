import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, ArrowRight, PartyPopper, Navigation, MapPinned } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import StatusStepper from '../components/StatusStepper'
import RouteMap from '../components/RouteMap'
import { LiveMap } from '../features/tracking/components/LiveMap'
import { NavHUD } from '../features/tracking/components/NavHUD'
import { LocationPermission } from '../features/tracking/components/LocationPermission'
import { GeofenceAlert } from '../features/tracking/components/GeofenceAlert'
import { useTrip } from '../state/TripContext'
import { useProfile } from '../state/ProfileContext'
import { useEarnings } from '../state/EarningsContext'
import { inr } from '../lib/format'
import { calculateTripSettlement } from '../lib/settlement'
import type { Coordinates, RouteWaypoint } from '../features/tracking/types'
import { lookupCity } from '../features/tracking/services/geocoding'
import { getRouteWithSteps } from '../features/tracking/services/routing'
import type { RouteWithSteps, RouteStep } from '../features/tracking/services/routing'
import { fetchPoisAlongRoute } from '../features/tracking/services/overpass'
import type { RoutePoI } from '../features/tracking/services/overpass'
import {
  getNavigationTarget,
  openTurnByTurnNavigation,
} from '../features/tracking/services/navigationLauncher'

// Finds the current step the driver is on based on distance to next maneuver
function findCurrentStep(steps: RouteStep[], _pos: Coordinates): RouteStep | null {
  if (!steps.length) return null;
  return steps[0]; // always show next maneuver (simplest correct approach)
}

// Haversine for remaining distance estimate
function haversine(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180, φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180, Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

// Closest distance (m) from a point to any vertex of a route path.
function minDistanceToPath(p: Coordinates, path: Coordinates[]): number {
  let min = Infinity;
  for (const pt of path) {
    const d = haversine(p, pt);
    if (d < min) min = d;
  }
  return min;
}

function RoutedLiveMap({
  pickup,
  drop,
  waypoints,
  driverPosition,
  navMode,
  pois,
  onToggleFullscreen,
  isFullscreen,
}: {
  pickup: Coordinates
  drop: Coordinates
  waypoints: RouteWaypoint[]
  driverPosition: Coordinates | null
  navMode: boolean
  pois: RoutePoI[]
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}) {
  const [routeData, setRouteData] = useState<RouteWithSteps | null>(null)
  const routeRef = useRef<{ path: Coordinates[]; dropKey: string } | null>(null)

  // Fetch a road-following route from the driver's live position (falling back
  // to the pickup city until the first GPS fix) to the drop. We DON'T re-route
  // on every GPS tick — the public OSRM demo is rate-limited and would start
  // returning straight-line fallbacks. Instead we keep the route as the truck
  // drives along it, and only re-route when the driver goes >600m off-route or
  // the destination changes. Failed fetches retry so a transient error doesn't
  // strand a straight line.
  const origin = driverPosition ?? pickup

  useEffect(() => {
    const dropKey = `${drop.lat.toFixed(4)},${drop.lng.toFixed(4)}`
    const prev = routeRef.current
    const dropChanged = !prev || prev.dropKey !== dropKey
    const offRoute = !!(driverPosition && prev?.path.length && minDistanceToPath(driverPosition, prev.path) > 600)
    if (prev && !dropChanged && !offRoute) return

    let cancelled = false
    let attempts = 0
    const fetchRoute = () => {
      getRouteWithSteps(origin, drop).then((r) => {
        if (cancelled) return
        // Retry transient routing failures (straight-line fallback) a couple times.
        if (r.isFallback && attempts < 2) {
          attempts += 1
          setTimeout(fetchRoute, 1500 * attempts)
          return
        }
        routeRef.current = { path: r.path, dropKey }
        setRouteData(r)
      })
    }
    fetchRoute()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPosition?.lat, driverPosition?.lng, drop.lat, drop.lng, pickup.lat, pickup.lng])

  const path = routeData?.path ?? [origin, drop]
  const steps = routeData?.steps ?? []
  const currentStep = driverPosition ? findCurrentStep(steps, driverPosition) : null

  const distanceRemainingM = driverPosition && routeData?.distanceMeters
    ? haversine(driverPosition, drop)
    : routeData?.distanceMeters ?? null

  const durationRemainingS = distanceRemainingM != null && routeData?.distanceMeters
    ? (distanceRemainingM / routeData.distanceMeters) * (routeData.durationSeconds ?? 0)
    : routeData?.durationSeconds ?? null

  return (
    <div className="h-full flex flex-col">
      <LiveMap
        driverPosition={driverPosition}
        route={path}
        waypoints={waypoints}
        pois={pois}
        height="100%"
        navMode={navMode}
        className="flex-1"
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
      />
      {navMode && (
        <NavHUD
          position={driverPosition}
          distanceRemainingM={distanceRemainingM}
          durationRemainingS={durationRemainingS}
          currentStep={currentStep}
          pois={pois}
        />
      )}
    </div>
  )
}

export default function ActiveTrip() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { drivers, driver, refreshProfile } = useProfile()
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
  const [navMode, setNavMode] = useState(false)
  const [pois, setPois] = useState<RoutePoI[]>([])
  const [openingNavigation, setOpeningNavigation] = useState(false)

  // Load POIs along the pickup→drop route. Hoisted above the early returns below
  // so the hook runs unconditionally on every render (Rules of Hooks).
  useEffect(() => {
    const trip = activeTrips.find((t) => t.id === selectedTripId) || (activeLoad ? { load: activeLoad } : null)
    const load = trip?.load
    if (!load) return
    const pickup = lookupCity(load.fromCity) ?? { lat: 28.6139, lng: 77.209, timestamp: Date.now() }
    const drop = lookupCity(load.toCity) ?? { lat: 26.9124, lng: 75.7873, timestamp: Date.now() }
    fetchPoisAlongRoute([pickup, drop]).then(setPois).catch(() => {})
  }, [selectedTripId, activeLoad, activeTrips])

  if (!selectedTripId && activeTrips.length > 0) {
    return (
      <div className="h-full flex flex-col">
        <TopBar title="Fleet Tracking" />
        <div className="flex-1 app-scroll no-scrollbar px-5 pt-4 pb-tabs space-y-4">
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

  const activeTrip = activeTrips.find(t => t.id === selectedTripId) || (activeLoad ? { id: 't_self', load: activeLoad, step: tripStep } : null)

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
  const isFirstSelfTrip =
    !selectedTripId &&
    localStorage.getItem(`ht_first_trip_done_${driver.phone}`) !== '1' &&
    driver.phone !== '+91 98765 43210'
  const settlement = calculateTripSettlement(currentLoad.price, isFirstSelfTrip)

  const stepKeys = ['toPickup', 'loaded', 'transit', 'delivered'] as const
  const steps = stepKeys.map((k) => t(`trip.steps.${k}`))
  const done = currentStep

  function finish() {
    if (selectedTripId) {
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
    if (selectedTripId) {
      advanceTripOwner(tripId)
    } else {
      advanceTrip()
    }
  }

  // Resolve real coordinates from the load's cities (offline table). Falls back
  // to Delhi / Jaipur only if a city name is unknown.
  const pickupCoord = lookupCity(currentLoad.fromCity) ?? { lat: 28.6139, lng: 77.209, timestamp: Date.now() }
  const dropCoord = lookupCity(currentLoad.toCity) ?? { lat: 26.9124, lng: 75.7873, timestamp: Date.now() }

  const waypoints: RouteWaypoint[] = [
    {
      id: `pickup-${currentLoad.id}`,
      coordinates: pickupCoord,
      label: `${currentLoad.fromCity}, ${currentLoad.fromArea}`,
      type: 'pickup',
      geofenceRadius: 200,
      triggered: false,
    },
    {
      id: `drop-${currentLoad.id}`,
      coordinates: dropCoord,
      label: `${currentLoad.toCity}, ${currentLoad.toArea}`,
      type: 'drop',
      geofenceRadius: 200,
      triggered: false,
    },
  ]

  const routeCoords = waypoints.map((wp) => wp.coordinates)
  const { geofenceStatus } = trackingState
  const navigationTarget = getNavigationTarget(
    currentStep,
    { coordinates: pickupCoord, label: `${currentLoad.fromCity}, ${currentLoad.fromArea}`, stage: 'pickup' },
    { coordinates: dropCoord, label: `${currentLoad.toCity}, ${currentLoad.toArea}`, stage: 'drop' },
  )

  async function handleStartNavigation() {
    if (!navigationTarget) return
    setOpeningNavigation(true)
    try {
      await openTurnByTurnNavigation(navigationTarget.coordinates)
    } finally {
      setOpeningNavigation(false)
    }
  }

  // Fullscreen nav mode — covers entire screen
  if (navMode) {
    return (
      <div className="h-full flex flex-col relative">
        <RoutedLiveMap
          pickup={pickupCoord}
          drop={dropCoord}
          driverPosition={trackingState.driverPosition}
          waypoints={waypoints}
          navMode={true}
          pois={pois}
          onToggleFullscreen={() => setNavMode(false)}
          isFullscreen={true}
        />
        {/* Exit nav mode button */}
        <button
          onClick={() => setNavMode(false)}
          className="absolute top-4 left-4 z-[1100] bg-surface/90 backdrop-blur border border-hairline rounded-2xl px-3 py-2 shadow-pop flex items-center gap-2 text-sm font-black text-ink"
        >
          ✕ Exit Nav
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={selectedTripId ? `Trip Detail: ${currentLoad.id}` : t('trip.title')}
        back={!!selectedTripId}
        onBack={selectedTripId ? () => setSelectedTripId(null) : undefined}
      />
      <div className="flex-1 app-scroll no-scrollbar pb-action">
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
              <RoutedLiveMap
                pickup={pickupCoord}
                drop={dropCoord}
                driverPosition={trackingState.driverPosition}
                waypoints={waypoints}
                navMode={false}
                pois={pois}
                onToggleFullscreen={() => setNavMode(true)}
                isFullscreen={false}
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
              <p className="mt-3 text-lg font-extrabold text-ink">{selectedTripId ? 'Trip Fully Delivered!' : t('trip.completed')}</p>
              
              {!selectedTripId ? (
                <>
                  <p className="text-xs text-ink-muted mt-1">
                    {isFirstSelfTrip ? 'First Trip Settlement (Marketing Support Applied)' : 'Trip Settlement'}
                  </p>
                  <div className="my-3 py-2.5 px-3.5 bg-surface-sunken rounded-xl text-left text-xs font-bold text-ink-muted space-y-1.5 border border-success/20 max-w-[260px] mx-auto">
                    <div className="flex justify-between">
                      <span>Trip Amount:</span>
                      <span className="nums text-ink">{inr(settlement.grossAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-500">
                      <span>HindTrucks Commission (10%):</span>
                      <span className="nums font-black">-{inr(settlement.commissionAmount)}</span>
                    </div>
                    {settlement.marketingSupport > 0 && (
                      <div className="flex justify-between text-success">
                        <span>First Trip Marketing Support:</span>
                        <span className="nums font-black">+{inr(settlement.marketingSupport)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Final Commission:</span>
                      <span className="nums text-ink">-{inr(settlement.platformCommission)}</span>
                    </div>
                    <div className="border-t border-hairline my-1"></div>
                    <div className="flex justify-between text-success font-black text-sm">
                      <span>Net Added to Wallet:</span>
                      <span className="nums">{inr(settlement.driverPayout)}</span>
                    </div>
                  </div>
                  {settlement.marketingSupport > 0 && (
                    <p className="text-[10px] text-ink-faint font-semibold max-w-[240px] mx-auto leading-normal">
                      HindTrucks has reduced its commission by ₹500 on your first trip as marketing support.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-muted mt-1">{selectedTripId ? 'Payment released to your wallet:' : t('trip.earned')}</p>
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

              {navigationTarget && (
                <button
                  type="button"
                  onClick={handleStartNavigation}
                  disabled={openingNavigation}
                  className="mb-5 w-full rounded-2xl bg-night-900 text-white shadow-card border border-night-700 p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  <span className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <MapPinned size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">
                      {openingNavigation ? t('trip.openingNavigation') : t('trip.startNavigation')}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-white/65 truncate">
                      {navigationTarget.stage === 'pickup' ? t('trip.navigateToPickup') : t('trip.navigateToDrop')}
                      {navigationTarget.label}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-accent" />
                </button>
              )}

              <StatusStepper steps={steps} current={done} />
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/90 border-t border-hairline backdrop-blur-xl safe-bottom z-10">
        {isComplete ? (
          <Button full variant="dark" onClick={finish}>
            {selectedTripId ? 'Back to Fleet List' : t('trip.backHome')}
          </Button>
        ) : (
          <Button full onClick={handleAdvance}>
            {selectedTripId ? `Advance Driver Stage (${steps[done] ?? steps[steps.length - 1]})` : t('trip.markNext', { step: steps[done] ?? steps[steps.length - 1] })}
          </Button>
        )}
      </div>
    </div>
  )
}
