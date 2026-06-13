import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Sofa, Container, Boxes, MapPin, Flag } from 'lucide-react'
import { Button, formatRupees, formatDistance, type GoodsKey } from '@hindtrucks/shared'
import { useBookings } from '../state/BookingsContext'
import { lookupCity } from '../data/cityCoords'
import TopBar from '../components/TopBar'

const GOODS: { key: GoodsKey; icon: typeof Package }[] = [
  { key: 'electronics', icon: Package },
  { key: 'furniture', icon: Sofa },
  { key: 'containers', icon: Container },
  { key: 'parcels', icon: Boxes },
]

const TRUCK_TYPES = ['14 ft · 4 Ton', '17 ft · 6 Ton', '19 ft · 9 Ton', '32 ft · 21 Ton']

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const field =
  'h-12 w-full rounded-xl border border-hairline bg-surface px-3.5 text-base font-semibold text-ink outline-none focus:border-accent placeholder:font-medium placeholder:text-ink-faint'

export default function NewBooking() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createBooking } = useBookings()

  const [fromCity, setFromCity] = useState('')
  const [fromArea, setFromArea] = useState('')
  const [toCity, setToCity] = useState('')
  const [toArea, setToArea] = useState('')
  const [goods, setGoods] = useState<GoodsKey>('electronics')
  const [weight, setWeight] = useState('')
  const [truckType, setTruckType] = useState(TRUCK_TYPES[2])
  const [price, setPrice] = useState('')
  const [advance, setAdvance] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const distanceKm = useMemo(() => {
    const a = lookupCity(fromCity)
    const b = lookupCity(toCity)
    if (a && b) return Math.round(haversine(a, b) * 1.25)
    return null
  }, [fromCity, toCity])

  const valid =
    fromCity && fromArea && toCity && toArea && Number(weight) > 0 && Number(price) > 0

  const submit = async () => {
    if (!valid) {
      setError(t('book.fillAll'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createBooking({
        fromCity, fromArea, toCity, toArea,
        goods,
        weightTon: Number(weight),
        truckType,
        distanceKm: distanceKm ?? 200,
        price: Number(price),
        advance: Number(advance) || Math.round(Number(price) * 0.3),
      })
      navigate('/bookings')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post booking')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title={t('book.title')} />
      <div className="app-scroll app-x flex-1 pb-tabs">
        <p className="mb-4 text-sm text-ink-muted">{t('book.greeting')}</p>

        {/* Route */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-success" />
            <input className={field} value={fromCity} onChange={(e) => setFromCity(e.target.value)} placeholder={t('book.pickupCity')} />
          </div>
          <input className={field} value={fromArea} onChange={(e) => setFromArea(e.target.value)} placeholder={t('book.pickupArea')} />
          <div className="flex items-center gap-2 pt-1">
            <Flag className="h-4 w-4 shrink-0 text-ink" />
            <input className={field} value={toCity} onChange={(e) => setToCity(e.target.value)} placeholder={t('book.dropCity')} />
          </div>
          <input className={field} value={toArea} onChange={(e) => setToArea(e.target.value)} placeholder={t('book.dropArea')} />
        </div>

        {distanceKm !== null && (
          <p className="mt-2 text-xs font-bold text-info">{t('book.distance')}: ~{formatDistance(distanceKm)}</p>
        )}

        {/* Goods */}
        <h2 className="mb-2 mt-5 text-sm font-bold text-ink-muted">{t('book.goodsType')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {GOODS.map(({ key, icon: Icon }) => {
            const active = goods === key
            return (
              <button
                key={key}
                onClick={() => setGoods(key)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-bold transition-colors ${
                  active ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-surface text-ink-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(`goods.${key}`)}
              </button>
            )
          })}
        </div>

        {/* Weight + truck */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-muted">{t('book.weight')}</label>
            <input className={field} type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="9" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-muted">{t('book.truckType')}</label>
            <select className={field} value={truckType} onChange={(e) => setTruckType(e.target.value)}>
              {TRUCK_TYPES.map((tt) => (
                <option key={tt} value={tt}>{tt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-muted">{t('book.price')}</label>
            <input className={field} type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="18500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-muted">{t('book.advance')}</label>
            <input className={field} type="number" inputMode="numeric" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="6000" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}

        <div className="mt-5">
          <Button full size="xl" loading={busy} onClick={submit}>
            {price ? `${t('book.post')} · ${formatRupees(Number(price))}` : t('book.post')}
          </Button>
        </div>
      </div>
    </div>
  )
}
