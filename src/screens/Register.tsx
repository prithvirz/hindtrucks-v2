import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Truck, ShieldCheck, FileText, Building2, Check, ArrowRight, ArrowLeft, Loader2, Camera } from 'lucide-react'
import Button from '../components/Button'
import TopBar from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

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

type DocType = 'licenseOrPan' | 'rc' | 'permit'

interface DocState {
  status: 'pending' | 'scanning' | 'verified'
  id: string
}

export default function Register() {
  const nav = useNavigate()
  const { initializeProfile } = useProfile()

  // Wizard Step State
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1: Personal Details
  const [name, setName] = useState('')
  const [role, setRole] = useState<'driver' | 'owner'>('driver')
  const [license, setLicense] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Step 2: Truck Details
  const [truckReg, setTruckReg] = useState('')
  const [truckType, setTruckType] = useState('19 ft Container')
  const [truckCapacity, setTruckCapacity] = useState('9 Ton')

  // Step 3: Document Scanner States
  const [documents, setDocuments] = useState<Record<DocType, DocState>>({
    licenseOrPan: { status: 'pending', id: '' },
    rc: { status: 'pending', id: '' },
    permit: { status: 'pending', id: '' }
  })

  // Auto-fill capacity when truck type changes
  useEffect(() => {
    if (TYPE_CAPACITIES[truckType]) {
      setTruckCapacity(TYPE_CAPACITIES[truckType])
    }
  }, [truckType])

  // Validations
  const isNameValid = name.trim().length >= 3
  const isLicenseValid = role === 'owner' || license.trim().length >= 5
  const isCompanyValid = role === 'driver' || companyName.trim().length >= 3
  const isStep1Valid = isNameValid && isLicenseValid && isCompanyValid

  const isTruckRegValid = truckReg.trim().length >= 6
  const isStep2Valid = isTruckRegValid

  const allDocsVerified =
    documents.licenseOrPan.status === 'verified' &&
    documents.rc.status === 'verified' &&
    documents.permit.status === 'verified'
  const isStep3Valid = allDocsVerified

  // Simulation of OCR scanning
  function handleUploadDoc(docKey: DocType) {
    if (documents[docKey].status === 'verified' || documents[docKey].status === 'scanning') return

    // Set to scanning
    setDocuments(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], status: 'scanning' }
    }))

    // Simulate scanning delay
    setTimeout(() => {
      let mockId = ''
      if (docKey === 'licenseOrPan') {
        mockId = role === 'driver'
          ? (license.trim().toUpperCase() || 'DL-' + Math.floor(1000000 + Math.random() * 9000000))
          : 'PAN-' + Math.floor(100000 + Math.random() * 900000)
      } else if (docKey === 'rc') {
        mockId = truckReg.trim().toUpperCase()
      } else {
        mockId = 'NP-' + Math.floor(200000 + Math.random() * 800000)
      }

      setDocuments(prev => ({
        ...prev,
        [docKey]: { status: 'verified', id: mockId }
      }))
    }, 1200)
  }

  function handleCreateAccount() {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) return

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
    <div className="h-full flex flex-col bg-surface-grey font-bold text-ink">
      <TopBar title="Complete Verification" />

      {/* Step Progress Bar Indicator */}
      <div className="bg-surface px-5 py-4 border-b border-hairline flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center justify-between w-full relative">
          {/* Background Connecting Line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-ink/10 -translate-y-1/2 z-0" />
          <div
            className="absolute top-4 left-4 h-1 bg-accent -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />

          {/* Step 1 Capsule */}
          <button
            disabled={step < 1}
            onClick={() => setStep(1)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${step >= 1 ? 'border-accent bg-accent text-white shadow-sm' : 'border-ink bg-surface-base text-ink'
              }`}>
              {step > 1 ? <Check size={14} strokeWidth={3.5} /> : '1'}
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider text-ink">Personal</span>
          </button>

          {/* Step 2 Capsule */}
          <button
            disabled={step < 2 && !isStep1Valid}
            onClick={() => setStep(2)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${step > 2 ? 'border-accent bg-accent text-white shadow-sm' : step === 2 ? 'border-accent bg-surface-base text-accent' : 'border-ink/20 bg-surface-grey text-ink-faint'
              }`}>
              {step > 2 ? <Check size={14} strokeWidth={3.5} /> : '2'}
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider text-ink-muted">Truck</span>
          </button>

          {/* Step 3 Capsule */}
          <button
            disabled={step < 3 && (!isStep1Valid || !isStep2Valid)}
            onClick={() => setStep(3)}
            className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${step === 3 ? 'border-accent bg-surface-base text-accent' : 'border-ink/20 bg-surface-grey text-ink-faint'
              }`}>
              '3'
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider text-ink-muted">Docs</span>
          </button>
        </div>
      </div>

      {/* Wizard Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-28 space-y-5">

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-5 animate-scale-in">
            {/* Intro */}
            <div className="bg-surface p-4 boxed-rounded border border-hairline shadow-card">
              <h2 className="text-lg font-black text-ink">Welcome to HindTrucks!</h2>
              <p className="text-xs text-ink-muted mt-1 font-bold">
                Let's start with your role and name details. This takes less than 2 minutes.
              </p>
            </div>

            {/* Select Role */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-ink-muted">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3.5">

                {/* Driver */}
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`p-4 text-left transition-all boxed-rounded border flex flex-col justify-between h-36 ${role === 'driver'
                      ? 'border-accent bg-accent/12 shadow-[0_8px_24px_rgba(242,106,27,0.2)]'
                      : 'border-hairline bg-surface hover:bg-surface-sunken shadow-card'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`p-2 rounded-xl border ${role === 'driver' ? 'border-accent bg-accent/10 text-accent' : 'border-hairline bg-surface-grey text-ink-faint'}`}>
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

                {/* Fleet Owner */}
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-4 text-left transition-all boxed-rounded border flex flex-col justify-between h-36 ${role === 'owner'
                      ? 'border-accent bg-accent/12 shadow-[0_8px_24px_rgba(242,106,27,0.2)]'
                      : 'border-hairline bg-surface hover:bg-surface-sunken shadow-card'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`p-2 rounded-xl border ${role === 'owner' ? 'border-accent bg-accent/10 text-accent' : 'border-hairline bg-surface-grey text-ink-faint'}`}>
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
            <div className="bg-surface p-5 boxed-rounded border border-hairline shadow-card space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-black uppercase text-ink-muted">Full Name</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <User size={16} className="text-ink-faint" />
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold"
                  />
                </div>
              </div>

              {/* Conditional Fields */}
              {role === 'driver' ? (
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-black uppercase text-ink-muted">Driving License Number</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
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
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-black uppercase text-ink-muted">Fleet / Company Name</label>
                  <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
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
          </div>
        )}

        {/* STEP 2: Truck Details */}
        {step === 2 && (
          <div className="space-y-5 animate-scale-in">
            {/* Info header */}
            <div className="bg-surface p-4 boxed-rounded border border-hairline shadow-card text-left">
              <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
                <Truck size={16} className="text-accent" />
                {role === 'owner' ? 'Register First Fleet Vehicle' : 'Your Truck Details'}
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-normal font-bold">
                Input your truck number and size. We match your truck with high-paying loads automatically.
              </p>
            </div>

            {/* Truck Form */}
            <div className="bg-surface p-5 boxed-rounded border border-hairline shadow-card space-y-4">
              {/* Truck Number */}
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Registration Number</label>
                <div className="flex items-center gap-2 h-12 rounded-xl bg-surface-grey border border-hairline px-3 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 transition-all">
                  <span className="text-xs font-bold text-ink-faint">IND</span>
                  <input
                    type="text"
                    placeholder="e.g. PB10 AB 4521"
                    value={truckReg}
                    onChange={(e) => setTruckReg(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-ink text-[15px] font-bold placeholder:text-ink-faint placeholder:font-semibold uppercase"
                  />
                </div>
              </div>

              {/* Type & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-black uppercase text-ink-muted">Truck Type</label>
                  <select
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40 outline-none transition-all cursor-pointer text-xs"
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
                    className="w-full h-12 px-3 bg-surface-grey text-ink font-bold rounded-xl border border-hairline focus:bg-surface-sunken focus:ring-2 focus:ring-accent/40 outline-none transition-all text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Verification Documents */}
        {step === 3 && (
          <div className="space-y-5 animate-scale-in">
            {/* Info Box */}
            <div className="bg-surface p-4 boxed-rounded border border-hairline shadow-card text-left">
              <h3 className="text-sm font-black text-ink flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-success" />
                Upload Documents
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-normal font-bold">
                Tap each card to scan your documents. HindTrucks AI instantly verifies details for immediate activation.
              </p>
            </div>

            {/* Upload Cards */}
            <div className="space-y-3">
              {/* Document 1: License or PAN */}
              <DocumentUploadCard
                label={role === 'driver' ? 'Driving License (Front)' : 'Fleet Business PAN Card'}
                docState={documents.licenseOrPan}
                onClick={() => handleUploadDoc('licenseOrPan')}
              />

              {/* Document 2: RC Book */}
              <DocumentUploadCard
                label={`RC Book Copy (for ${truckReg.toUpperCase() || 'Truck'})`}
                docState={documents.rc}
                onClick={() => handleUploadDoc('rc')}
              />

              {/* Document 3: National Permit */}
              <DocumentUploadCard
                label="National Permit (NP Certificate)"
                docState={documents.permit}
                onClick={() => handleUploadDoc('permit')}
              />
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 text-[11px] text-ink-muted font-bold px-2 justify-center">
              <ShieldCheck size={14} className="text-success shrink-0" />
              <span>Documents are stored securely and encrypted in transit.</span>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER WIZARD NAVIGATION BAR */}
      <div className="absolute bottom-0 inset-x-0 p-5 bg-surface/95 backdrop-blur border-t border-hairline safe-bottom z-10 flex gap-3">
        {step === 1 && (
          <Button full disabled={!isStep1Valid} onClick={() => setStep(2)} rightIcon={<ArrowRight size={16} />}>
            Next: Truck Details
          </Button>
        )}

        {step === 2 && (
          <>
            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button className="flex-1" disabled={!isStep2Valid} onClick={() => setStep(3)} rightIcon={<ArrowRight size={16} />}>
              Next: Documents
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button variant="secondary" onClick={() => setStep(2)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!isStep3Valid}
              onClick={handleCreateAccount}
              leftIcon={<ShieldCheck size={16} />}
            >
              Verify & Claim ₹1,500
            </Button>
          </>
        )}
      </div>

    </div>
  )
}

function DocumentUploadCard({
  label,
  docState,
  onClick
}: {
  label: string
  docState: DocState
  onClick: () => void
}) {
  const { status, id } = docState

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 text-left transition-all boxed-rounded border flex items-center justify-between gap-4 select-none ${status === 'verified'
          ? 'border-success bg-success/12 shadow-[0_8px_24px_rgba(57,233,144,0.15)]'
          : status === 'scanning'
            ? 'border-yellow-500 bg-yellow-500/12 shadow-[0_8px_24px_rgba(234,179,8,0.15)] animate-pulse'
            : 'border-hairline bg-surface hover:bg-surface-sunken shadow-card'
        }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${status === 'verified'
            ? 'bg-success/15 border-success text-success'
            : status === 'scanning'
              ? 'bg-yellow-500/15 border-yellow-500 text-yellow-500'
              : 'bg-surface-grey border-hairline text-ink-faint'
          }`}>
          {status === 'verified' ? (
            <Check size={20} strokeWidth={3} />
          ) : status === 'scanning' ? (
            <Loader2 className="animate-spin text-yellow-500" size={20} strokeWidth={3} />
          ) : (
            <Camera size={20} strokeWidth={2} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-ink leading-tight truncate">{label}</p>
          <p className="text-[10px] text-ink-muted font-bold mt-1 font-mono uppercase tracking-wider">
            {status === 'verified'
              ? `ID: ${id}`
              : status === 'scanning'
                ? 'HindTrucks AI verifying OCR...'
                : 'Tap to Scan / Upload'}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {status === 'verified' ? (
          <span className="text-[9px] font-black uppercase text-success bg-success/12 border border-success/20 px-2 py-1 rounded-lg select-none">
            Verified
          </span>
        ) : status === 'scanning' ? (
          <span className="text-[9px] font-black uppercase text-yellow-500 bg-yellow-500/12 border border-yellow-500/20 px-2 py-1 rounded-lg select-none">
            Scanning
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase text-ink-muted bg-surface-grey border border-hairline px-2 py-1 rounded-lg select-none">
            Upload
          </span>
        )}
      </div>
    </button>
  )
}
