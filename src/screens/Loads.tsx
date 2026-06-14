import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackageOpen } from 'lucide-react'
import TopBar from '../components/TopBar'
import LoadCard from '../components/LoadCard'
import type { Load } from '../data/mockLoads'
import { loadsService } from '../services/index'
import { useProfile } from '../state/ProfileContext'
import { isTruckCompatible } from '../lib/matching'

export default function Loads() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { driver, role } = useProfile()
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTruckId, setSelectedTruckId] = useState<string>('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    loadsService
      .getLoads()
      .then((res) => {
        if (active) setLoads(res.data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Filter loads based on chosen truck pill
  const filteredLoads = loads.filter((load) => {
    if (selectedTruckId === 'all') {
      if (role === 'owner') {
        const activeTrucks = (driver.trucks || []).filter((t) => t.isActive !== false)
        return activeTrucks.some((truck) => isTruckCompatible(load, truck))
      }
      return true
    }
    const truck = (driver.trucks || []).find((t) => t.id === selectedTruckId)
    if (!truck) return true
    return isTruckCompatible(load, truck)
  })

  const visibleTrucks = role === 'owner'
    ? (driver.trucks || []).filter((t) => t.isActive !== false)
    : (driver.trucks || [])

  return (
    <div className="h-full flex flex-col">
      <TopBar title={t('loads.title')} />

      {/* Fleet matching filter pills */}
      <div className="w-full max-w-full overflow-hidden bg-surface-grey border-b border-hairline shrink-0">
        <div className="flex max-w-full gap-2 overflow-x-auto no-scrollbar px-5 py-3.5">
        <button
          onClick={() => setSelectedTruckId('all')}
          className={`h-7 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 border flex items-center justify-center ${selectedTruckId === 'all'
              ? 'bg-ink text-surface border-ink shadow-xs'
              : 'bg-surface-sunken text-ink-muted border-hairline hover:bg-surface'
            }`}
        >
          {t('common.all') || 'All'}
        </button>
        {visibleTrucks.map((truck) => {
          const isSelected = selectedTruckId === truck.id
          const isActive = truck.regNumber === driver.truck.regNumber
          return (
            <button
              key={truck.id}
              onClick={() => setSelectedTruckId(truck.id)}
              className={`h-7 px-3.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-150 border flex items-center justify-center gap-1.5 ${isSelected
                  ? 'bg-accent text-white border-accent shadow-xs'
                  : 'bg-surface-sunken text-ink-muted border-hairline hover:bg-surface'
                }`}
            >
              {isActive && role !== 'owner' && <span className="w-1.5 h-1.5 rounded-full bg-[#39E990] animate-pulse" />}
              {truck.regNumber} ({parseFloat(truck.capacity)}T)
            </button>
          )
        })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-32">
        <p className="text-sm text-ink-muted mb-4">
          {t('loads.subtitle', { count: filteredLoads.length })}
        </p>

        {loading ? (
          <div data-testid="loads-loading" className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredLoads.length === 0 ? (
          <div data-testid="loads-empty" className="rounded-2xl border border-dashed border-hairline bg-surface-grey p-10 text-center mt-8">
            <PackageOpen size={32} className="mx-auto text-ink-faint" />
            <p className="mt-3 font-semibold text-ink">{t('loads.empty')}</p>
            <p className="text-sm text-ink-muted mt-1">{t('loads.emptyHint')}</p>
          </div>
        ) : (
          <div data-testid="loads-list" className="flex flex-col gap-3">
            {filteredLoads.map((load) => (
              <LoadCard key={load.id} load={load} onClick={() => nav(`/loads/${load.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadCardSkeleton() {
  return (
    <div className="flex bg-surface boxed-rounded-lg boxed-border boxed-shadow overflow-hidden">
      <div className="skeleton h-[112px] w-[104px] shrink-0" />
      <div className="flex-1 p-3.5 space-y-2.5">
        <div className="skeleton h-4 w-3/5 rounded-md" />
        <div className="skeleton h-3 w-4/5 rounded-md" />
        <div className="skeleton h-3 w-2/5 rounded-md" />
        <div className="skeleton h-5 w-1/3 rounded-md mt-1" />
      </div>
    </div>
  )
}
