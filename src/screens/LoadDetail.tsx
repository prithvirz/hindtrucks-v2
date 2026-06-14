import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Circle,
  Package,
  Weight,
  Truck,
  BadgeCheck,
  Building2,
  IndianRupee,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import type { Load } from '../data/mockLoads'
import { loadsService } from '../services/index'
import { useTrip } from '../state/TripContext'
import { useProfile } from '../state/ProfileContext'
import { inr } from '../lib/format'
import { getCompatibleTrucks } from '../lib/matching'

export default function LoadDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useTranslation()
  const { acceptLoad, acceptLoadOwner } = useTrip()
  const { driver, setOnline, setActiveTruck, role, drivers } = useProfile()
  const [assignOpen, setAssignOpen] = useState(false)
  const [load, setLoad] = useState<Load | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    loadsService
      .getLoadDetail({ loadId: id })
      .then((res) => {
        if (active) setLoad(res.load)
      })
      .catch(() => {
        if (active) setLoad(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <TopBar title={t('loadDetail.title')} back fallbackTo="/loads" />
        <p className="p-5 text-ink-muted">{t('common.loading')}</p>
      </div>
    )
  }

  if (!load) {
    return (
      <div className="h-full flex flex-col">
        <TopBar title={t('loadDetail.title')} back fallbackTo="/loads" />
        <p className="p-5 text-ink-muted">Not found.</p>
      </div>
    )
  }

  const compatibleTrucks = getCompatibleTrucks(load, driver.trucks || []).filter((t) => {
    if (role === 'owner') return t.isActive !== false
    return true
  })

  function accept() {
    setAssignOpen(true)
  }

  function handleConfirmAssignment(truckId: string) {
    const selectedTruck = compatibleTrucks.find((t) => t.id === truckId)
    if (selectedTruck && selectedTruck.regNumber !== driver.truck.regNumber) {
      setActiveTruck(selectedTruck.id)
    }
    setOnline(true)
    acceptLoad(load!)
    nav('/trip', { replace: true })
  }

  function handleConfirmAssignmentOwner(truckId: string, driverId: string) {
    setOnline(true)
    acceptLoadOwner(load!, truckId, driverId)
    nav('/trip', { replace: true })
  }

  return (
    <div className="h-full flex flex-col relative">
      <TopBar title={t('loadDetail.title')} back fallbackTo="/loads" />
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {/* Hero */}
        <div className="relative h-40">
          <img src={load.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-grey to-transparent" />
          <span className="absolute top-3 left-3 text-xs font-bold text-ink bg-surface/90 px-2.5 py-1 rounded-full">
            #{load.id}
          </span>
        </div>

        <div className="px-5 -mt-4 relative space-y-4">
          {/* Price headline */}
          <div className="rounded-2xl bg-surface shadow-card border border-hairline/60 p-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-extrabold text-ink leading-none nums tracking-tight">{inr(load.price)}</p>
              <p className="text-xs text-ink-muted mt-1.5 nums">
                {load.distanceKm} {t('common.km')} · {load.truckType}
              </p>
            </div>
            <span className="text-xs font-semibold text-ink-muted nums">
              ≈ {inr(Math.round(load.price / load.distanceKm))}
              {t('common.perKm')}
            </span>
          </div>

          {/* Route */}
          <div className="rounded-2xl bg-surface shadow-card border border-hairline/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-3">
              {t('loadDetail.route')}
            </p>
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <Circle size={12} className="text-accent fill-accent" />
                <span className="w-0.5 flex-1 bg-hairline my-1" style={{ minHeight: 28 }} />
                <MapPin size={15} className="text-success" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-[11px] text-ink-faint">{t('loads.pickup')}</p>
                  <p className="font-bold text-ink">{load.fromCity}</p>
                  <p className="text-xs text-ink-muted">{load.fromArea}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">{t('loads.drop')}</p>
                  <p className="font-bold text-ink">{load.toCity}</p>
                  <p className="text-xs text-ink-muted">{load.toArea}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            <Spec icon={<Package size={17} />} label={t('loadDetail.goodsType')} value={t(`goods.${load.goods}`)} />
            <Spec icon={<Weight size={17} />} label={t('loads.weight')} value={`${load.weightTon} ${t('common.ton')}`} />
            <Spec icon={<Truck size={17} />} label={t('loadDetail.truckType')} value={load.truckType.split('·')[0]} />
          </div>

          {/* Shipper */}
          <div className="rounded-2xl bg-surface shadow-card border border-hairline/60 p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-accent-soft flex items-center justify-center">
              <Building2 size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-ink-faint" data-testid="shipper-label">{t('loadDetail.shipper')}</p>
              <p className="font-bold text-ink leading-tight">{load.shipperName}</p>
            </div>
            {load.shipperVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                <BadgeCheck size={13} /> {t('common.verified')}
              </span>
            )}
          </div>

          {/* Payment split */}
          <div className="rounded-2xl bg-accent-soft border border-accent/20 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2 inline-flex items-center gap-1">
              <IndianRupee size={13} /> {t('loadDetail.payment')}
            </p>
            <div className="flex justify-between text-sm py-1">
              <span className="text-ink-muted">{t('loadDetail.advance')}</span>
              <span className="font-bold text-ink nums">{inr(load.advance)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-ink-muted">{t('loadDetail.balance')}</span>
              <span className="font-bold text-ink nums">{inr(load.price - load.advance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accept */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/95 backdrop-blur border-t border-hairline safe-bottom z-10">
        <Button full onClick={accept} data-testid="accept-load-button">
          {t('loadDetail.accept')} · {inr(load.price)}
        </Button>
      </div>

      {/* Confirm Assignment Bottom Sheet */}
      {assignOpen && (
        <ConfirmAssignmentSheet
          onClose={() => setAssignOpen(false)}
          compatibleTrucks={compatibleTrucks}
          activeTruck={driver.truck}
          role={role}
          drivers={drivers}
          onConfirm={handleConfirmAssignment}
          onConfirmOwner={handleConfirmAssignmentOwner}
        />
      )}
    </div>
  )
}

function ConfirmAssignmentSheet({
  onClose,
  compatibleTrucks,
  activeTruck,
  role,
  drivers,
  onConfirm,
  onConfirmOwner,
}: {
  onClose: () => void
  compatibleTrucks: any[]
  activeTruck: any
  role: 'driver' | 'owner'
  drivers: any[]
  onConfirm: (truckId: string) => void
  onConfirmOwner: (truckId: string, driverId: string) => void
}) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [selectedTruckId, setSelectedTruckId] = useState(compatibleTrucks.length > 0 ? compatibleTrucks[0].id : '')
  const [selectedDriverId, setSelectedDriverId] = useState(() => {
    if (role === 'owner' && drivers.length > 0) {
      const firstTruck = compatibleTrucks[0]
      const matchingDriver = drivers.find(d => d.assignedTruckId === firstTruck?.id)
      return matchingDriver ? matchingDriver.id : drivers[0].id
    }
    return ''
  })

  useEffect(() => {
    if (role === 'owner') {
      const matchingDriver = drivers.find(d => d.assignedTruckId === selectedTruckId)
      if (matchingDriver) {
        setSelectedDriverId(matchingDriver.id)
      }
    }
  }, [selectedTruckId, role, drivers])

  function handleConfirmBtn() {
    if (role === 'owner') {
      onConfirmOwner(selectedTruckId, selectedDriverId)
    } else {
      onConfirm(selectedTruckId)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      {/* Semi-transparent dark overlay backdrop */}
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      {/* Drawer content box */}
      <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop p-5 pb-8 animate-fade-up max-w-app w-full mx-auto text-left z-40 max-h-[85%] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">{role === 'owner' ? 'Assign Truck & Driver' : t('loads.assignTruckTitle')}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center bg-surface boxed-border boxed-rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {compatibleTrucks.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-ink text-xs font-semibold flex gap-2">
              <AlertTriangle className="shrink-0 text-accent" size={16} />
              <span>You do not have any compatible vehicles in your fleet for this load. Please add a compatible vehicle in your Profile.</span>
            </div>
            <Button full onClick={() => nav('/profile')}>
              Manage Fleet in Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-ink-muted leading-relaxed">
              {role === 'owner' ? 'Select a compatible vehicle and driver from your fleet to fulfill this load.' : t('loads.assignTruckDesc')}
            </p>

            {/* Select Truck */}
            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-ink-muted">Select Truck</p>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scrollbar">
                {compatibleTrucks.map((truck) => {
                  const isSelected = selectedTruckId === truck.id
                  const isActive = truck.regNumber === activeTruck.regNumber
                  return (
                    <button
                      key={truck.id}
                      type="button"
                      onClick={() => setSelectedTruckId(truck.id)}
                      className={`flex items-center justify-between p-3.5 transition-all boxed-rounded border ${isSelected
                        ? 'border-accent bg-accent-soft/30 text-ink'
                        : 'border-hairline bg-surface text-ink'
                        }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-sm nums tracking-wide">{truck.regNumber}</p>
                          {isActive && (
                            <span className="text-[9px] font-black text-success bg-success-soft px-1.5 py-0.5 rounded border border-success/20 select-none">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted font-bold mt-0.5">{truck.type} • {truck.capacity}</p>
                      </div>
                      {isSelected && (
                        <span className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Select Driver */}
            {role === 'owner' && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-black uppercase text-ink-muted">Assign Driver</p>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto no-scrollbar">
                  {drivers.length === 0 ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] font-bold">
                      Note: You have no drivers. Please add a driver in Profile.
                    </div>
                  ) : (
                    drivers.map((drv) => {
                      const isSelected = selectedDriverId === drv.id
                      const isAssignedToThisTruck = drv.assignedTruckId === selectedTruckId
                      return (
                        <button
                          key={drv.id}
                          type="button"
                          onClick={() => setSelectedDriverId(drv.id)}
                          className={`flex items-center justify-between p-3.5 transition-all boxed-rounded border ${isSelected
                            ? 'border-accent bg-accent-soft/30 text-ink'
                            : 'border-hairline bg-surface text-ink'
                            }`}
                        >
                          <div className="text-left">
                            <p className="font-extrabold text-sm">{drv.name}</p>
                            <p className="text-xs text-ink-muted font-bold mt-0.5">{drv.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            {isAssignedToThisTruck && (
                              <span className="text-[9px] font-black text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent select-none mr-2">
                                Assigned to Truck
                              </span>
                            )}
                            {isSelected && (
                              <span className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {/* Switch warning if selected is inactive */}
            {role === 'driver' && (() => {
              const selectedTruck = compatibleTrucks.find((t) => t.id === selectedTruckId)
              if (selectedTruck && selectedTruck.regNumber !== activeTruck.regNumber) {
                return (
                  <div className="p-3 bg-info-soft border border-info/20 rounded-xl text-ink text-[11px] font-bold">
                    Note: Accepting with this vehicle will switch it to your Active Truck.
                  </div>
                )
              }
              return null
            })()}

            <Button
              full
              onClick={handleConfirmBtn}
              disabled={role === 'owner' && drivers.length === 0}
            >
              {role === 'owner' ? 'Confirm & Assign' : t('loads.confirmAccept')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface shadow-card border border-hairline/60 p-3 text-center">
      <div className="flex justify-center text-accent mb-1.5">{icon}</div>
      <p className="text-[13px] font-bold text-ink leading-tight truncate">{value}</p>
      <p className="text-[10px] text-ink-faint mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
