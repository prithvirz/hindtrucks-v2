import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, ShieldCheck, FileText, Building2, Check } from 'lucide-react'
import Button from '../components/Button'
import TopBar from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'
import { useAuth } from '../state/AuthContext'

const TRUCK_TYPES = [
  '19 ft Container',
  '32 ft Container',
  'Open Truck (14 Wheeler)',
  'Dumper Truck',
  'Trailer LPT'
]

const TYPE_CAPACITIES: Record<string, string> = {
  '19 ft Container': '9 Ton',
  '32 ft Container': '15 Ton',
  'Open Truck (14 Wheeler)': '15 Ton',
  'Dumper Truck': '12 Ton',
  'Trailer LPT': '25 Ton'
}

export default function Register() {
  const nav = useNavigate()
  const { phone } = useAuth()
  const { initializeProfile } = useProfile()

  const [name, setName] = useState('')
  const [role, setRole] = useState<'driver' | 'owner'>('driver')
  const [license, setLicense] = useState('')
  const [companyName, setCompanyName] = useState('')
  
  const [truckReg, setTruckReg] = useState('')
  const [truckType, setTruckType] = useState('19 ft Container')
  const [truckCapacity, setTruckCapacity] = useState('9 Ton')

  // Auto-fill capacity when truck type changes
  useEffect(() => {
    if (TYPE_CAPACITIES[truckType]) {
      setTruckCapacity(TYPE_CAPACITIES[truckType])
    }
  }, [truckType])

  const isNameValid = name.trim().length >= 3
  const isLicenseValid = role === 'owner' || license.trim().length >= 5
  const isCompanyValid = role === 'driver' || companyName.trim().length >= 3
  const isTruckRegValid = truckReg.trim().length >= 6

  const isValid = isNameValid && isLicenseValid && isCompanyValid && isTruckRegValid

  function handleCreateAccount() {
    if (!isValid) return

    initializeProfile({
      name: name.trim(),
      role,
      licenseNumber: role === 'driver' ? license.trim().toUpperCase() : undefined,
      companyName: role === 'owner' ? companyName.trim() : undefined,
      truck: {
        regNumber: truckReg.trim().toUpperCase(),
        type: truckType,
        capacity: truckCapacity
      }
    })

    // ProfileContext initializes the profile and flags registration in local storage
    nav('/home', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-surface-grey">
      <TopBar title="Create Account" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-28 space-y-5">
        
        {/* Intro */}
        <div className="bg-white p-4 boxed-rounded border-2 border-ink shadow-[4px_4px_0px_0px_#0B0B0F]">
          <h2 className="text-lg font-black text-ink">Welcome to HindTrucks!</h2>
          <p className="text-xs text-ink-muted mt-1 font-bold">
            Complete your profile for phone number <span className="text-accent font-black nums">{phone || '+91 99999 99999'}</span> to start receiving loads.
          </p>
        </div>

        {/* Step 1: Select Role */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-ink-muted">Select Your Role</label>
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* Driver Option */}
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`p-4 text-left transition-all boxed-rounded border-2 flex flex-col justify-between h-36 ${
                role === 'driver'
                  ? 'border-accent bg-[#fff6f0] shadow-[4px_4px_0px_0px_#F26A1B]'
                  : 'border-ink bg-white hover:bg-surface-grey shadow-[4px_4px_0px_0px_#0B0B0F]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl border ${role === 'driver' ? 'border-accent bg-accent/10 text-accent' : 'border-ink/15 bg-surface-grey text-ink-muted'}`}>
                  <User size={18} strokeWidth={2.5} />
                </div>
                {role === 'driver' && (
                  <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                )}
              </div>
              <div>
                <p className="font-black text-sm text-ink leading-tight">Driver</p>
                <p className="text-[10px] text-ink-muted font-bold mt-1 leading-normal">
                  I drive my own vehicle or work for a fleet.
                </p>
              </div>
            </button>

            {/* Fleet Owner Option */}
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`p-4 text-left transition-all boxed-rounded border-2 flex flex-col justify-between h-36 ${
                role === 'owner'
                  ? 'border-accent bg-[#fff6f0] shadow-[4px_4px_0px_0px_#F26A1B]'
                  : 'border-ink bg-white hover:bg-surface-grey shadow-[4px_4px_0px_0px_#0B0B0F]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-xl border ${role === 'owner' ? 'border-accent bg-accent/10 text-accent' : 'border-ink/15 bg-surface-grey text-ink-muted'}`}>
                  <Building2 size={18} strokeWidth={2.5} />
                </div>
                {role === 'owner' && (
                  <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                )}
              </div>
              <div>
                <p className="font-black text-sm text-ink leading-tight">Fleet Owner</p>
                <p className="text-[10px] text-ink-muted font-bold mt-1 leading-normal">
                  I own a fleet and manage multiple trucks/drivers.
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white p-4 boxed-rounded border-2 border-ink shadow-[4px_4px_0px_0px_#0B0B0F] space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black uppercase text-ink-muted">Full Name</label>
            <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/40 transition-all">
              <User size={16} className="text-ink-faint" />
              <input
                type="text"
                placeholder="e.g. Gurpreet Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold"
              />
            </div>
          </div>

          {/* Conditional Role Fields */}
          {role === 'driver' ? (
            /* Driving License (Driver only) */
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-black uppercase text-ink-muted">Driving License Number</label>
              <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                <FileText size={16} className="text-ink-faint" />
                <input
                  type="text"
                  placeholder="e.g. DL-14201234567"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold uppercase"
                />
              </div>
            </div>
          ) : (
            /* Company Name (Owner only) */
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-black uppercase text-ink-muted">Fleet / Company Name</label>
              <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                <Building2 size={16} className="text-ink-faint" />
                <input
                  type="text"
                  placeholder="e.g. Shergill Logistics"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold"
                />
              </div>
            </div>
          )}

        </div>

        {/* Step 3: Truck Details */}
        <div className="bg-white p-4 boxed-rounded border-2 border-ink shadow-[4px_4px_0px_0px_#0B0B0F] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5 text-left">
            <Truck size={14} className="text-accent" />
            {role === 'owner' ? 'Register First Vehicle' : 'Your Truck Details'}
          </h3>

          {/* Truck Number */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Registration Number</label>
            <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/40 transition-all">
              <span className="text-xs font-bold text-ink-faint font-semibold">IND</span>
              <input
                type="text"
                placeholder="e.g. PB10 AB 4521"
                value={truckReg}
                onChange={(e) => setTruckReg(e.target.value)}
                className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold uppercase"
              />
            </div>
          </div>

          {/* Type and Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Type</label>
              <select
                value={truckType}
                onChange={(e) => setTruckType(e.target.value)}
                className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all cursor-pointer text-xs"
              >
                {TRUCK_TYPES.map((tOpt) => (
                  <option key={tOpt} value={tOpt}>{tOpt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-[10px] font-black uppercase text-ink-muted">Max Capacity</label>
              <input
                type="text"
                value={truckCapacity}
                onChange={(e) => setTruckCapacity(e.target.value)}
                placeholder="e.g. 9 Ton"
                className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all text-xs"
              />
            </div>
          </div>

        </div>

        {/* Security / Terms */}
        <div className="flex items-center gap-2 text-[11px] text-ink-muted font-bold px-2 justify-center">
          <ShieldCheck size={14} className="text-success shrink-0" />
          <span>I agree to HindTrucks transport agreement and terms of service.</span>
        </div>

      </div>

      {/* Footer Submit Button */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/95 backdrop-blur border-t border-hairline safe-bottom z-10">
        <Button full disabled={!isValid} onClick={handleCreateAccount}>
          Create Account
        </Button>
      </div>

    </div>
  )
}
