import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, Building2, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import Button from '../components/Button'
import TopBar from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

const TRUCK_TYPES = [
  '19 ft Container',
  '32 ft Container',
  'Open Truck (14 Wheeler)',
  'Dumper Truck',
  'Trailer LPT',
]

const TYPE_CAPACITIES: Record<string, string> = {
  '19 ft Container': '9 Ton',
  '32 ft Container': '15 Ton',
  'Open Truck (14 Wheeler)': '15 Ton',
  'Dumper Truck': '12 Ton',
  'Trailer LPT': '25 Ton',
}

export default function Register() {
  const nav = useNavigate()
  const { initializeProfile } = useProfile()

  const [step, setStep] = useState<1 | 2>(1)

  const [name, setName] = useState('')
  const [role, setRole] = useState<'driver' | 'owner'>('driver')
  const [license, setLicense] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [truckReg, setTruckReg] = useState('')
  const [truckType, setTruckType] = useState('19 ft Container')
  const [truckCapacity, setTruckCapacity] = useState('9 Ton')

  useEffect(() => {
    if (TYPE_CAPACITIES[truckType]) setTruckCapacity(TYPE_CAPACITIES[truckType])
  }, [truckType])

  const isStep1Valid =
    name.trim().length >= 3 &&
    (role === 'owner' || license.trim().length >= 5) &&
    (role === 'driver' || companyName.trim().length >= 3)

  const isStep2Valid = truckReg.trim().length >= 6

  function handleCreateAccount() {
    if (!isStep1Valid || !isStep2Valid) return
    initializeProfile({
      name: name.trim(),
      role,
      licenseNumber: role === 'driver' ? license.trim().toUpperCase() : undefined,
      companyName: role === 'owner' ? companyName.trim() : undefined,
      truck: { regNumber: truckReg.trim().toUpperCase(), type: truckType, capacity: truckCapacity },
    })
    nav('/home', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-surface-grey font-bold text-ink">
      <TopBar title="Create Account" />

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
                {s === 1 ? 'Personal' : 'Truck'}
              </span>
              {s < 2 && <div className={`flex-1 h-0.5 w-8 ${step > 1 ? 'bg-accent' : 'bg-ink/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-28 space-y-5">

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5 animate-scale-in">
            <div className="bg-surface p-4 rounded-2xl border border-hairline shadow-card">
              <h2 className="text-lg font-black text-ink">Welcome to HindTrucks!</h2>
              <p className="text-xs text-ink-muted mt-1 font-bold">Tell us your role and basic details.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-ink-muted">Your Role</label>
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
                      <p className="font-black text-sm text-ink">{r === 'driver' ? 'Driver' : 'Fleet Owner'}</p>
                      <p className="text-[10px] text-ink-muted font-bold mt-0.5 leading-normal">
                        {r === 'driver' ? 'I drive my own / fleet vehicle.' : 'I own and manage a fleet.'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-card space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase text-ink-muted">Full Name</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <User size={16} className="text-ink-faint" />
                  <input type="text" placeholder="e.g. Rajesh Kumar" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint" />
                </div>
              </div>

              {role === 'driver' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-ink-muted">Driving License Number</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                    <Truck size={16} className="text-ink-faint" />
                    <input type="text" placeholder="e.g. DL-14201234567" value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint uppercase" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase text-ink-muted">Company Name</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                    <Building2 size={16} className="text-ink-faint" />
                    <input type="text" placeholder="e.g. Shergill Logistics" value={companyName}
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
                {role === 'owner' ? 'Register First Truck' : 'Your Truck'}
              </h3>
              <p className="text-xs text-ink-muted mt-1 font-bold">
                We match your truck type with the best loads.
              </p>
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-card space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Registration Number</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <span className="text-xs font-bold text-ink-faint">IND</span>
                  <input type="text" placeholder="e.g. PB10 AB 4521" value={truckReg}
                    onChange={(e) => setTruckReg(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Type</label>
                  <select value={truckType} onChange={(e) => setTruckType(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:ring-2 focus:ring-accent/40 outline-none text-xs">
                    {TRUCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-ink-muted">Capacity</label>
                  <input type="text" value={truckCapacity} onChange={(e) => setTruckCapacity(e.target.value)}
                    placeholder="e.g. 9 Ton"
                    className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:ring-2 focus:ring-accent/40 outline-none text-xs" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/95 backdrop-blur border-t border-hairline safe-bottom z-10 flex gap-3">
        {step === 1 && (
          <Button full disabled={!isStep1Valid} onClick={() => setStep(2)} rightIcon={<ArrowRight size={16} />}>
            Next: Truck Details
          </Button>
        )}
        {step === 2 && (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>Back</Button>
            <Button className="flex-1" disabled={!isStep2Valid} onClick={handleCreateAccount}>
              Create Account
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
