import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Truck, Building2, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import Button from '../components/Button'
import TopBar from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

const TRUCK_TYPE_OPTIONS = [
  { value: '19 ft Container', labelKey: 'register.truckTypes.ft19' },
  { value: '32 ft Container', labelKey: 'register.truckTypes.ft32' },
  { value: 'Open Truck (14 Wheeler)', labelKey: 'register.truckTypes.open14' },
  { value: 'Dumper Truck', labelKey: 'register.truckTypes.dumper' },
  { value: 'Trailer LPT', labelKey: 'register.truckTypes.trailer' },
] as const

const TYPE_CAPACITY_TONS: Record<string, string> = {
  '19 ft Container': '9',
  '32 ft Container': '15',
  'Open Truck (14 Wheeler)': '15',
  'Dumper Truck': '12',
  'Trailer LPT': '25',
}

export default function Register() {
  const nav = useNavigate()
  const { t } = useTranslation()
  const { initializeProfile } = useProfile()

  const [step, setStep] = useState<1 | 2>(1)

  const [name, setName] = useState('')
  const [role, setRole] = useState<'driver' | 'owner'>('driver')
  const [license, setLicense] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [truckReg, setTruckReg] = useState('')
  const [truckType, setTruckType] = useState('19 ft Container')
  const [truckCapacityTons, setTruckCapacityTons] = useState('9')

  useEffect(() => {
    if (TYPE_CAPACITY_TONS[truckType]) setTruckCapacityTons(TYPE_CAPACITY_TONS[truckType])
  }, [truckType])

  const isStep1Valid =
    name.trim().length >= 3 &&
    (role === 'owner' || license.trim().length >= 5) &&
    (role === 'driver' || companyName.trim().length >= 3)

  const isStep2Valid = truckReg.trim().length >= 6 && truckCapacityTons.trim().length > 0

  function handleCreateAccount() {
    if (!isStep1Valid || !isStep2Valid) return
    initializeProfile({
      name: name.trim(),
      role,
      licenseNumber: role === 'driver' ? license.trim().toUpperCase() : undefined,
      companyName: role === 'owner' ? companyName.trim() : undefined,
      truck: { regNumber: truckReg.trim().toUpperCase(), type: truckType, capacity: `${truckCapacityTons.trim()} Ton` },
    })
    nav('/home', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-surface-grey font-bold text-ink">
      <TopBar title={t('register.title')} />

      {/* Step indicator */}
      <div className="bg-surface px-5 py-4 border-b border-hairline shrink-0">
        <div className="flex items-center gap-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all
                ${step > s ? 'border-accent bg-accent text-white' : step === s ? 'border-accent bg-surface text-accent' : 'border-ink/20 bg-surface-grey text-ink-faint'}`}>
                {step > s ? <Check size={14} strokeWidth={3.5} /> : s}
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider ${step >= s ? 'text-ink' : 'text-ink-faint'}`}>
                {s === 1 ? t('register.stepPersonal') : t('register.stepTruck')}
              </span>
              {s < 2 && <div className={`flex-1 h-0.5 w-8 ${step > 1 ? 'bg-accent' : 'bg-ink/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 app-scroll no-scrollbar px-5 pt-4 pb-action space-y-5">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5 animate-scale-in">
            <div className="bg-surface p-4 rounded-2xl border border-hairline shadow-card">
              <h2 className="text-lg font-black text-ink">{t('register.welcomeTitle')}</h2>
              <p className="text-xs text-ink-muted mt-1 font-bold">{t('register.welcomeSubtitle')}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-ink-muted">{t('register.roleLabel')}</label>
              <div className="grid grid-cols-2 gap-3">
                {(['driver', 'owner'] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`p-4 text-left rounded-2xl border flex flex-col justify-between h-32 transition-all
                      ${role === r ? 'border-accent bg-accent/12 shadow-[0_8px_24px_rgba(242,106,27,0.2)]' : 'border-hairline bg-surface hover:bg-surface-sunken shadow-card'}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-2 rounded-xl border ${role === r ? 'border-accent bg-accent/10 text-accent' : 'border-hairline bg-surface-grey text-ink-faint'}`}>
                        {r === 'driver' ? <User size={18} strokeWidth={2.5} /> : <Building2 size={18} strokeWidth={2.5} />}
                      </div>
                      {role === r && <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center"><Check size={12} strokeWidth={3.5} /></span>}
                    </div>
                    <div>
                      <p className="font-black text-sm text-ink">{t(`register.roles.${r}.title`)}</p>
                      <p className="text-[10px] text-ink-muted font-bold mt-0.5 leading-normal">
                        {t(`register.roles.${r}.description`)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-card space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink-muted">{t('register.fullName')}</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <User size={16} className="text-ink-faint" />
                  <input type="text" placeholder={t('register.fullNamePlaceholder')} value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint" />
                </div>
              </div>

              {role === 'driver' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-ink-muted">{t('register.licenseNumber')}</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                    <Truck size={16} className="text-ink-faint" />
                    <input type="text" placeholder={t('register.licensePlaceholder')} value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint uppercase" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-ink-muted">{t('register.companyName')}</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                    <Building2 size={16} className="text-ink-faint" />
                    <input type="text" placeholder={t('register.companyPlaceholder')} value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5 animate-scale-in">
            <div className="bg-surface p-4 rounded-2xl border border-hairline shadow-card">
              <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
                <Truck size={16} className="text-accent" />
                {role === 'owner' ? t('register.firstTruckTitle') : t('register.truckTitle')}
              </h3>
              <p className="text-xs text-ink-muted mt-1 font-bold">
                {t('register.truckSubtitle')}
              </p>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-card space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-ink-muted">{t('register.truckRegNumber')}</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <span className="text-xs font-bold text-ink-faint">IND</span>
                  <input type="text" placeholder={t('register.truckRegPlaceholder')} value={truckReg}
                    onChange={(e) => setTruckReg(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-ink-muted">{t('register.truckType')}</label>
                  <select value={truckType} onChange={(e) => setTruckType(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:ring-2 focus:ring-accent/40 outline-none text-xs">
                    {TRUCK_TYPE_OPTIONS.map(({ value, labelKey }) => (
                      <option key={value} value={value}>{t(labelKey)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-ink-muted">{t('register.capacity')}</label>
                  <div className="relative">
                    <input type="text" inputMode="decimal" value={truckCapacityTons}
                      onChange={(e) => setTruckCapacityTons(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                      placeholder={t('register.capacityPlaceholder')}
                      className="w-full h-12 pl-3 pr-11 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:ring-2 focus:ring-accent/40 outline-none text-xs" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-ink-muted pointer-events-none">
                      {t('common.ton')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/95 backdrop-blur border-t border-hairline safe-bottom z-10 flex gap-3">
        {step === 1 && (
          <Button full disabled={!isStep1Valid} onClick={() => setStep(2)} rightIcon={<ArrowRight size={16} />}>
            {t('register.nextTruckDetails')}
          </Button>
        )}
        {step === 2 && (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>{t('common.back')}</Button>
            <Button className="flex-1" disabled={!isStep2Valid} onClick={handleCreateAccount}>
              {t('register.createAccount')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
