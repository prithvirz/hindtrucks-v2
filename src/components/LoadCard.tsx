import { useTranslation } from 'react-i18next'
import { ArrowRight, Package, Weight, BadgeCheck, ShieldAlert } from 'lucide-react'
import type { Load } from '../data/mockLoads'
import { inr } from '../lib/format'
import { useProfile } from '../state/ProfileContext'
import { getCompatibleTrucks } from '../lib/matching'

interface Props {
  load: Load
  onClick?: () => void
}

export default function LoadCard({ load, onClick }: Props) {
  const { t } = useTranslation()
  const { driver } = useProfile()
  const matchingTrucks = getCompatibleTrucks(load, driver.trucks || [])

  let badgeEl = null
  if (matchingTrucks.length === 1) {
    badgeEl = (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/12 border border-success/20 px-2 py-0.5 rounded-md mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        {t('loads.fitsTruck', { reg: matchingTrucks[0].regNumber })}
      </span>
    )
  } else if (matchingTrucks.length > 1) {
    badgeEl = (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-info bg-info/12 border border-info/20 px-2 py-0.5 rounded-md mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-info" />
        {t('loads.fitsTrucks', { count: matchingTrucks.length })}
      </span>
    )
  } else {
    badgeEl = (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink-muted bg-surface-grey border border-white/5 px-2 py-0.5 rounded-md mt-2">
        <ShieldAlert size={10} className="text-amber-500" />
        {t('loads.noMatchingTruck')}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      className="load-card w-full text-left bg-surface boxed-rounded-lg boxed-border boxed-shadow boxed-btn-active overflow-hidden transition-all duration-200 animate-fade-up"
    >
      <div className="flex">
        <img
          src={load.image}
          alt=""
          loading="lazy"
          className="h-[118px] w-[104px] object-cover shrink-0 border-r border-hairline"
        />
        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
          <div>
            {/* Route */}
            <div className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
              <span className="truncate">{load.fromCity}</span>
              <ArrowRight size={15} className="text-accent shrink-0" strokeWidth={2.5} />
              <span className="truncate">{load.toCity}</span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 truncate">
              {load.fromArea} → {load.toArea}
            </p>

            {/* Meta chips */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1 font-bold">
                <Package size={13} /> {t(`goods.${load.goods}`)}
              </span>
              <span className="inline-flex items-center gap-1 font-bold">
                <Weight size={13} /> {load.weightTon} {t('common.ton')}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-1">
            <div>
              <p className="text-[18px] font-black text-ink leading-none nums">
                {inr(load.price)}
              </p>
              <p className="text-[10px] text-ink-faint mt-0.5 font-bold nums">
                {load.distanceKm} {t('common.km')}
              </p>
            </div>
            <div className="flex flex-col items-end">
              {load.shipperVerified && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-success bg-success/12 border border-success/20 px-1.5 py-0.5 boxed-rounded shrink-0">
                  <BadgeCheck size={11} /> {t('common.verified')}
                </span>
              )}
              {badgeEl}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
