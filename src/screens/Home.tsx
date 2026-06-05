import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, TrendingUp, Truck, ChevronRight, MapPin, Award } from 'lucide-react'
import Toggle from '../components/Toggle'
import Button from '../components/Button'
import LoadCard from '../components/LoadCard'
import { useProfile } from '../state/ProfileContext'
import { useTrip } from '../state/TripContext'
import { MOCK_LOADS } from '../data/mockLoads'
import { inr } from '../lib/format'
import { images } from '../lib/assets'

const BFC_MEMBERS = [
  { name: 'Rajbir Singh', isCurrent: true, rating: 4.8, truck: 'PB10 AB 4521' },
  { name: 'Gurpreet Singh', isCurrent: false, rating: 4.9, truck: 'PB10 CD 6732' },
  { name: 'Satnam Singh', isCurrent: false, rating: 4.7, truck: 'PB02 XY 9811' },
  { name: 'Amit Kumar', isCurrent: false, rating: 4.8, truck: 'DL01 ZA 2045' },
]

export default function Home() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { isOnline, setOnline, driver, role, drivers } = useProfile()
  const { activeTrips, activeLoad } = useTrip()
  const nearby = MOCK_LOADS.slice(0, 2)

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-32">
      {/* Sticky status area cover */}
      <div className="sticky top-0 z-20 h-[env(safe-area-inset-top,0px)] bg-night-900 w-full shrink-0" />

      {/* Header with Tour ID - Premium Deep Gradient */}
      <div id="driver-profile" className="relative px-5 pt-6 pb-7 bg-gradient-to-br from-night-900 via-night-800 to-night-700 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-success/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div id="driver-profile-card" className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={images.driverAvatar}
                alt=""
                className="h-12 w-12 rounded-2xl ring-2 ring-white/15 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-black text-[17px] leading-tight tracking-tight truncate max-w-[120px] sm:max-w-none">
                    {driver.name}
                  </p>
                  <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-yellow-500 to-accent px-1.5 py-0.5 rounded-md shrink-0">
                    {role === 'owner' ? 'Fleet Owner' : 'BFC Elite'}
                  </span>
                </div>
                <p className="text-white/60 text-xs mt-0.5 font-bold tracking-wider truncate">
                  {role === 'owner' ? `${driver.trucks.length} Trucks • ${drivers.length} Drivers` : driver.truck.regNumber}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-full border border-white/10 shadow-xs nums shrink-0">
              <Star size={13} className="fill-yellow-400 text-yellow-400" /> {driver.rating}
            </span>
          </div>

          {/* Online toggle Card with Tour ID */}
          <div id="online-toggle" className="mt-5 flex items-center justify-between bg-surface text-ink boxed-border boxed-shadow boxed-rounded-lg p-4">
            <div className="flex-1 pr-3">
              <p className="font-black text-[14px] text-ink uppercase tracking-wider">
                {role === 'owner' ? t('profile.fleetOnlineStatus') : (isOnline ? t('common.online') : t('common.offline'))}
              </p>
              <p className="text-ink-muted text-xs mt-0.5 leading-snug font-semibold">
                {role === 'owner' ? t('profile.fleetOnlineStatusDesc') : (isOnline ? t('home.statusOnline') : t('home.statusOffline'))}
              </p>
            </div>
            <Toggle on={isOnline} onChange={setOnline} />
          </div>
        </div>
      </div>

      {/* Stat cards with Tour ID */}
      <div className="px-5 -mt-3.5 relative z-10">
        <div id="stats-card" className="bg-surface boxed-border boxed-shadow boxed-rounded-lg p-4 grid grid-cols-3 divide-x divide-hairline">
          <Stat
            icon={<TrendingUp size={16} className="text-accent" />}
            label={role === 'owner' ? 'Fleet Earnings' : t('home.todayEarnings')}
            value={role === 'owner' ? inr(85000 + activeTrips.reduce((acc, t) => acc + t.load.price, 0)) : inr(driver.earningsToday)}
          />
          <Stat
            icon={<Truck size={16} className="text-accent" />}
            label={role === 'owner' ? 'Active Trips' : t('home.trips')}
            value={role === 'owner' ? `${activeTrips.length}` : `${driver.tripsToday}`}
          />
          <Stat
            icon={<Star size={16} className="text-accent" />}
            label={role === 'owner' ? 'Fleet Size' : t('home.rating')}
            value={role === 'owner' ? `${driver.trucks.length}` : `${driver.rating}`}
          />
        </div>
      </div>

      {/* BFC Member Leaderboard - Premium Driver Cards */}
      {/* Active Fleet Trips stepper list */}
      {role === 'owner' && (
        <div className="px-5 mt-6">
          <div className="bg-surface boxed-border boxed-shadow boxed-rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 mb-3.5 border-b border-hairline pb-2.5">
              <Truck className="text-accent shrink-0" size={20} />
              <div>
                <h2 className="text-[15px] font-black text-ink leading-tight">Active Fleet Trips</h2>
                <p className="text-[11px] text-ink-muted font-bold tracking-tight">Real-time status of your active trucks</p>
              </div>
            </div>
            {activeTrips.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-hairline rounded-3xl bg-surface-grey/50">
                <Truck className="mx-auto text-ink-faint mb-3 opacity-20" size={32} />
                <p className="text-xs font-black text-ink-muted uppercase tracking-wider mb-4">No active trips currently running</p>
                <Button size="sm" onClick={() => nav('/loads')}>
                  Book a Load
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeTrips.map((trip) => {
                  const tk = driver.trucks.find(t => t.id === trip.truckId || t.regNumber === trip.truckId)
                  const drv = drivers.find(d => d.id === trip.driverId)
                  const steps = ['Booked', 'Loaded', 'Transit', 'Arrived']
                  return (
                    <div key={trip.id} className="p-3.5 bg-surface-grey rounded-xl border border-hairline flex flex-col gap-2.5 text-left relative overflow-hidden">
                      {/* Left vertical status indicator strip */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-accent" />

                      <div className="flex items-start justify-between gap-2 pl-1.5">
                        <div>
                          <p className="text-sm font-extrabold text-ink nums tracking-wide">
                            {tk?.regNumber || trip.truckId}
                          </p>
                          <p className="text-xs text-ink-muted font-bold mt-0.5">
                            Driver: {drv?.name || 'Self'} • {trip.load.goods}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-accent nums">{inr(trip.load.price)}</p>
                          <button
                            onClick={() => nav('/trip')}
                            className="text-[10px] font-black text-accent mt-1 hover:underline block ml-auto"
                          >
                            Track &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Route Map Pin Text */}
                      <div className="flex items-center gap-1.5 text-xs text-ink font-extrabold pl-1.5">
                        <span className="truncate">{trip.load.fromCity}</span>
                        <span className="text-ink-faint font-normal">&rarr;</span>
                        <span className="truncate">{trip.load.toCity}</span>
                      </div>

                      {/* Micro Stepper Display */}
                      <div className="flex items-center justify-between gap-1.5 mt-1 border-t border-hairline/25 pt-2.5 pl-1.5">
                        {steps.map((st, idx) => {
                          const stepNum = idx + 1
                          const isDone = trip.step >= stepNum
                          const isCurrent = trip.step === stepNum
                          return (
                            <div key={st} className="flex-1 flex flex-col items-center">
                              <div className={`h-2.5 w-full rounded-full transition-colors ${isCurrent ? 'bg-accent animate-pulse' : isDone ? 'bg-success' : 'bg-ink/10'
                                }`} />
                              <span className={`text-[9px] font-black mt-1 leading-none ${isCurrent ? 'text-accent' : isDone ? 'text-success' : 'text-ink-faint'
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
      )}

      {role === 'driver' && activeLoad && (
        <div className="px-5 mt-6">
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 text-left shadow-lg shadow-accent/5 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-accent" />
            <div className="flex justify-between items-center gap-2 pl-1.5">
              <div>
                <span className="text-[10px] font-black uppercase text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent">
                  📍 Active GPS Tracking
                </span>
                <h3 className="text-sm font-black text-ink mt-1.5 leading-tight">
                  {activeLoad.fromCity} &rarr; {activeLoad.toCity}
                </h3>
                <p className="text-[10px] text-ink-muted font-bold mt-1">
                  HPCL, BPCL Partner Petrol Pumps visible on route.
                </p>
              </div>
              <Button size="sm" onClick={() => nav('/trip')} className="shrink-0" rightIcon={<ChevronRight size={14} />}>
                Track
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mt-6">
        <div id="bfc-leaderboard" className="bg-surface boxed-border boxed-shadow boxed-rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3.5 border-b border-hairline pb-2.5">
            <Award className="text-accent shrink-0" size={20} />
            <div>
              <h2 className="text-[15px] font-black text-ink leading-tight">{t('home.bfcTitle')}</h2>
              <p className="text-[11px] text-ink-muted font-bold tracking-tight">{t('home.bfcSubtitle')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {BFC_MEMBERS.map((member, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2.5 boxed-rounded border ${member.isCurrent ? 'bg-accent-soft/40 border-accent' : 'bg-surface-grey border-hairline/40'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-accent w-4 text-center">#{i + 1}</span>
                  {/* Driver Initials Badge */}
                  <div className={`h-8.5 w-8.5 rounded-full flex items-center justify-center font-black text-xs border ${member.isCurrent ? 'bg-accent text-white border-white/20' : 'bg-surface-sunken text-ink-muted border-hairline'
                    }`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-extrabold text-ink leading-tight">
                        {member.name}
                      </p>
                      {member.isCurrent && (
                        <span className="text-[8px] font-bold bg-accent text-white px-1.5 py-0.5 rounded uppercase shrink-0">You</span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-muted font-bold mt-0.5">{member.truck}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-surface-sunken px-2 py-0.5 border border-hairline rounded-lg shadow-xs nums text-ink">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {member.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Nearby loads */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-black text-ink">{t('home.nearbyLoads')}</h2>
          <button
            onClick={() => nav('/loads')}
            className="text-sm font-black text-accent inline-flex items-center hover:underline"
          >
            {t('common.viewAll')} <ChevronRight size={16} className="stroke-[3]" />
          </button>
        </div>

        {isOnline ? (
          <div className="flex flex-col gap-3">
            {nearby.map((load) => (
              <LoadCard key={load.id} load={load} onClick={() => nav(`/loads/${load.id}`)} />
            ))}
          </div>
        ) : (
          <button
            onClick={() => setOnline(true)}
            className="w-full boxed-rounded-lg border border-dashed border-hairline bg-surface-grey p-8 text-center active:scale-[0.99] transition-all duration-200 hover:bg-surface/50"
          >
            <MapPin size={28} className="mx-auto text-accent animate-bounce" />
            <p className="mt-2 text-sm text-ink font-black">{t('home.noNearby')}</p>
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-2 first:pl-0 last:pr-0">
      <div className="flex items-center gap-1.5">{icon}</div>
      <p className="text-[18px] font-extrabold text-ink mt-1.5 leading-none nums">{value}</p>
      <p className="text-[11px] text-ink-muted mt-1.5 font-bold leading-tight">{label}</p>
    </div>
  )
}
