import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Truck,
  FileText,
  Globe,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Star,
  BadgeCheck,
  X,
  Check,
  Share2,
  Copy,
  Award,
  Bell,
  Users,
} from 'lucide-react'
import TopBar from '../components/TopBar'
import { useAuth } from '../state/AuthContext'
import { useProfile } from '../state/ProfileContext'
import { useShell } from '../state/ShellContext'
import { LANGUAGES, type LangCode } from '../i18n/languages'
import { NotificationCenter } from '../features/notifications/components/NotificationCenter'
import Toggle from '../components/Toggle'

// Unsplash helper for high-fidelity images
const u = (id: string, w = 240) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export default function Profile() {
  const nav = useNavigate()
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const {
    driver,
    updateDriver,
    addTruck,
    removeTruck,
    setActiveTruck,
    role,
    setRole,
    drivers,
    addDriver,
    removeDriver,
    assignDriverToTruck,
    toggleTruckActive,
  } = useProfile()
  const {
    startTour,
    pushNotifications,
    unreadPushCount,
    markPushRead,
    markAllPushRead,
    deletePushNotification,
  } = useShell()
  const [langOpen, setLangOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [addTruckOpen, setAddTruckOpen] = useState(false)
  const [addDriverOpen, setAddDriverOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notifCenterOpen, setNotifCenterOpen] = useState(false)

  const current = LANGUAGES.find((l) => l.code === (i18n.language?.slice(0, 2) as LangCode))

  const referLink = `https://hindtrucks.in/refer/${driver.truck.regNumber.replace(/\s+/g, '')}`

  function handleCopy() {
    navigator.clipboard.writeText(referLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function doLogout() {
    logout()
    nav('/', { replace: true, state: { immediateLanding: true } })
  }

  const [selectedDoc, setSelectedDoc] = useState<'rc' | 'license' | 'permit' | null>(null)

  const docs = [
    { label: t('profile.docRC'), id: driver.documents.rc.id, type: 'rc' as const },
    { label: t('profile.docLicense'), id: driver.documents.license.id, type: 'license' as const },
    { label: t('profile.docPermit'), id: driver.documents.permit.id, type: 'permit' as const },
  ]

  return (
    <div className="h-full flex flex-col relative">
      <TopBar title={t('profile.title')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-32 space-y-5">

        {/* App Mode Toggle */}
        <div className="bg-white p-3.5 boxed-rounded border-2 border-ink shadow-[4px_4px_0px_0px_#0B0B0F] flex flex-col gap-2">
          <p className="text-sm font-black text-ink">APP MODE</p>
          <div className="grid w-full grid-cols-2 bg-surface-grey border border-ink/15 p-1 rounded-xl font-extrabold text-[11px]">
            <button
              onClick={() => setRole('driver')}
              className={`min-w-0 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                role === 'driver' ? 'bg-accent text-white font-black' : 'text-ink-muted'
              }`}
            >
              Driver Mode
            </button>
            <button
              onClick={() => setRole('owner')}
              className={`min-w-0 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                role === 'owner' ? 'bg-accent text-white font-black' : 'text-ink-muted'
              }`}
            >
              Fleet Owner Mode
            </button>
          </div>
        </div>

        {/* Driver header */}
        <div className="flex items-center gap-4 bg-white p-4 boxed-rounded border-2 border-ink shadow-[4px_4px_0px_0px_#0B0B0F]">
          <div className="relative shrink-0">
            <img
              src={u(driver.avatarId, 240)}
              alt=""
              className="h-16 w-16 boxed-rounded border-2 border-ink object-cover bg-surface-grey"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-lg font-black text-ink leading-tight truncate">{driver.name}</p>
              <span className="inline-flex items-center text-[9px] font-black uppercase text-accent bg-accent-soft px-1.5 py-0.5 boxed-rounded border border-accent shrink-0">
                {role === 'owner' ? 'Fleet Owner' : 'BFC Elite'}
              </span>
            </div>
            <p className="text-sm text-ink-muted font-bold">{driver.phone}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-ink">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" /> {driver.rating}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-white border border-success px-1.5 py-0.5 boxed-rounded">
                  <BadgeCheck size={12} /> {t('common.verified')}
                </span>
              </div>

              <button
                onClick={() => setEditOpen(true)}
                className="text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] px-2.5 py-1.5 boxed-rounded border border-accent shadow-[2px_2px_0px_0px_#F26A1B] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shrink-0"
              >
                {t('profile.editProfile')}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Fleet Management */}
        <Section
          title={t('profile.manageVehicles')}
          icon={<Truck size={16} className="text-accent" />}
          action={
            <button
              onClick={() => setAddTruckOpen(true)}
              className="text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] border border-accent boxed-rounded px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#F26A1B] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shrink-0 flex items-center gap-1"
            >
              + {t('profile.addTruck')}
            </button>
          }
        >
          {/* Active Truck Details Banners */}
          <div className="py-3.5 border-b border-hairline bg-accent-soft/20 -mx-4 px-4 border-l-4 border-l-accent flex items-start justify-between">
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[9px] font-black uppercase text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent select-none">
                {t('profile.activeTruck')}
              </span>
              <p className="text-base font-extrabold text-ink mt-1.5 nums tracking-wide">{driver.truck.regNumber}</p>
              <p className="text-xs text-ink-muted font-bold mt-0.5">{driver.truck.type} • {driver.truck.capacity}</p>
            </div>
            <div className="h-10 w-10 shrink-0 bg-white border border-hairline rounded-lg flex items-center justify-center shadow-sm">
              <Truck size={18} className="text-accent" />
            </div>
          </div>

          {/* List of Registered Fleet */}
          <div className="divide-y divide-hairline">
            {driver.trucks.map((tk) => {
              if (role === 'owner') {
                const isTruckActive = tk.isActive !== false
                return (
                  <div key={tk.id} className="py-3 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-ink nums tracking-wide">{tk.regNumber}</p>
                        {isTruckActive && (
                          <span className="text-[9px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded border border-success select-none">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-faint font-semibold mt-0.5">{tk.type} ({tk.capacity})</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Toggle on={isTruckActive} onChange={() => toggleTruckActive(tk.id)} />
                      <button
                        onClick={() => removeTruck(tk.id)}
                        className="p-1.5 text-ink-faint hover:text-red-500 bg-white hover:bg-red-50 border border-hairline hover:border-red-200 rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                        title={t('profile.removeTruck')}
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                )
              } else {
                const isActive = tk.regNumber === driver.truck.regNumber
                return (
                  <div key={tk.id} className="py-3 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-ink nums tracking-wide">{tk.regNumber}</p>
                        {isActive && (
                          <span className="text-[9px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded border border-success select-none">
                            {t('profile.activeTruck')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-faint font-semibold mt-0.5">{tk.type} ({tk.capacity})</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive ? (
                        <>
                          <button
                            onClick={() => setActiveTruck(tk.id)}
                            className="px-2.5 py-1 bg-white hover:bg-surface-grey text-xs font-black text-ink border border-hairline rounded-lg active:scale-95 transition-all shadow-sm"
                          >
                            {t('profile.selectActive')}
                          </button>
                          <button
                            onClick={() => removeTruck(tk.id)}
                            className="p-1.5 text-ink-faint hover:text-red-500 bg-white hover:bg-red-50 border border-hairline hover:border-red-200 rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                            title={t('profile.removeTruck')}
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </>
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-success/15 text-success flex items-center justify-center select-none">
                          <Check size={15} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </Section>

        {role === 'owner' && (
          <Section
            title="Manage Drivers"
            icon={<Users size={16} className="text-accent" />}
            action={
              <button
                onClick={() => setAddDriverOpen(true)}
                className="text-xs font-black text-accent bg-accent-soft hover:bg-[#ffe8d6] border border-accent boxed-rounded px-2.5 py-1 shadow-[1.5px_1.5px_0px_0px_#F26A1B] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shrink-0 flex items-center gap-1"
              >
                + Add Driver
              </button>
            }
          >
            <div className="divide-y divide-hairline">
              {drivers.length === 0 ? (
                <div className="py-4 text-center text-xs text-ink-faint font-bold">
                  No drivers registered. Add a driver to start assigning loads.
                </div>
              ) : (
                drivers.map((drv) => {
                  const assignedTruck = driver.trucks.find(t => t.id === drv.assignedTruckId)
                  return (
                    <div key={drv.id} className="py-3 flex flex-col gap-2.5 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-ink">{drv.name}</p>
                          <p className="text-xs text-ink-muted font-bold mt-0.5">{drv.phone} • Lic: {drv.licenseNumber}</p>
                        </div>
                        <button
                          onClick={() => removeDriver(drv.id)}
                          className="p-1.5 text-ink-faint hover:text-red-500 bg-white hover:bg-red-50 border border-hairline hover:border-red-200 rounded-lg active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0"
                          title="Remove Driver"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 bg-surface-grey/50 p-2 rounded-xl border border-hairline/10">
                        <span className="text-[10px] font-black uppercase text-ink-muted shrink-0">Truck:</span>
                        <select
                          value={drv.assignedTruckId || ''}
                          onChange={(e) => assignDriverToTruck(drv.id, e.target.value || null)}
                          className="min-w-0 flex-1 bg-white border border-hairline rounded-lg text-xs font-bold px-2 py-1 outline-none text-ink cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {driver.trucks.map((tk) => (
                            <option key={tk.id} value={tk.id}>
                              {tk.regNumber} ({tk.capacity})
                            </option>
                          ))}
                        </select>
                        {assignedTruck && (
                          <span className="text-[10px] font-bold text-success bg-success-soft px-1.5 py-0.5 rounded border border-success shrink-0">
                            Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Section>
        )}

        {/* Referral Section */}
        <Section title="Refer & Earn" icon={<Share2 size={16} className="text-accent" />}>
          <div className="py-3 flex flex-col gap-2">
            <p className="text-xs font-bold text-ink-muted leading-relaxed text-left">
              Invite other drivers to HindTrucks. Earn ₹1,000 when they complete their first trip.
            </p>
            <div className="flex gap-2 items-center bg-surface-grey ring-1 ring-accent/25 rounded-xl p-2 mt-1 min-w-0">
              <span className="text-xs text-ink font-bold truncate flex-1 leading-none select-all">{referLink}</span>
              <button
                onClick={handleCopy}
                className="h-8 px-3 flex items-center gap-1.5 bg-accent text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
              >
                {copied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                {copied ? t('home.copied') : t('home.copyLink')}
              </button>
            </div>
          </div>
        </Section>

        {/* Documents */}
        <Section title={t('profile.documents')} icon={<FileText size={16} className="text-accent" />}>
          {docs.map((d, i) => (
            <div
              key={d.label}
              onClick={() => setSelectedDoc(d.type)}
              className={`flex items-center gap-3 py-3 cursor-pointer hover:bg-surface-grey/50 px-2 -mx-2 rounded-xl transition-colors ${i < docs.length - 1 ? 'border-b border-hairline' : ''
                }`}
            >
              <div className="h-9 w-9 boxed-rounded boxed-border bg-surface-grey flex items-center justify-center">
                <FileText size={16} className="text-ink-muted" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-black text-ink">{d.label}</p>
                <p className="text-xs text-ink-faint truncate font-semibold">{d.id}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-white border border-success px-2 py-0.5 boxed-rounded shrink-0">
                <BadgeCheck size={12} /> {t('profile.docValid')}
              </span>
            </div>
          ))}
        </Section>

        {/* Settings list */}
        <div className="bg-surface boxed-rounded-lg boxed-border boxed-shadow overflow-hidden">
          <button
            onClick={() => setLangOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-grey active:bg-surface-grey transition border-b border-hairline"
          >
            <Globe size={18} className="text-ink-muted" />
            <span className="flex-1 text-left font-extrabold text-ink text-[15px]">
              {t('profile.language')}
            </span>
            <span className="text-sm text-ink font-bold">{current?.nativeName}</span>
            <ChevronRight size={18} className="text-ink-faint" />
          </button>

          <button
            onClick={() => {
              startTour()
              nav('/home')
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-grey active:bg-surface-grey transition border-b border-hairline"
          >
            <Award size={18} className="text-accent" />
            <span className="flex-1 text-left font-extrabold text-accent text-[15px]">
              Replay Guided Tour
            </span>
            <ChevronRight size={18} className="text-accent" />
          </button>

          <button
            onClick={() => setNotifCenterOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-grey active:bg-surface-grey transition border-b border-hairline"
          >
            <Bell size={18} className="text-accent" />
            <span className="flex-1 text-left font-extrabold text-ink text-[15px]">
              Notifications
            </span>
            {unreadPushCount > 0 && (
              <span className="min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1">
                {unreadPushCount > 99 ? '99+' : unreadPushCount}
              </span>
            )}
            <ChevronRight size={18} className="text-ink-faint" />
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-grey transition">
            <LifeBuoy size={18} className="text-ink-muted" />
            <span className="flex-1 text-left font-extrabold text-ink text-[15px]">
              {t('profile.support')}
            </span>
            <ChevronRight size={18} className="text-ink-faint" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={doLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl ring-1 ring-red-200 text-red-600 bg-red-50/70 font-bold active:scale-[0.99] transition-all"
        >
          <LogOut size={18} strokeWidth={2.5} /> {t('profile.logout')}
        </button>
      </div>

      {/* Language sheet */}
      {langOpen && (
        <LanguageSheet
          onClose={() => setLangOpen(false)}
          current={current?.code}
          onPick={(code) => {
            i18n.changeLanguage(code)
            setLangOpen(false)
          }}
        />
      )}

      {/* Edit Profile Sheet */}
      {editOpen && (
        <EditProfileSheet
          onClose={() => setEditOpen(false)}
          driver={driver}
          onSave={(updated) => {
            updateDriver(updated)
            setEditOpen(false)
          }}
        />
      )}

      {/* Add Truck sheet */}
      {addTruckOpen && (
        <AddTruckSheet
          onClose={() => setAddTruckOpen(false)}
          onAdd={(tk) => {
            addTruck(tk)
            setAddTruckOpen(false)
          }}
        />
      )}

      {/* Add Driver sheet */}
      {addDriverOpen && (
        <AddDriverSheet
          onClose={() => setAddDriverOpen(false)}
          onAdd={(drv) => {
            addDriver(drv)
            setAddDriverOpen(false)
          }}
        />
      )}

      {/* Interactive Document Viewer Sheet */}
      {selectedDoc && (
        <DocumentModal
          type={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Notification Center */}
      {notifCenterOpen && (
        <NotificationCenter
          notifications={pushNotifications}
          unreadCount={unreadPushCount}
          onMarkRead={markPushRead}
          onMarkAllRead={markAllPushRead}
          onDelete={deletePushNotification}
          onClose={() => setNotifCenterOpen(false)}
        />
      )}
    </div>
  )
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-black uppercase tracking-wide text-ink">{title}</h2>
        </div>
        {action}
      </div>
      <div className="bg-surface boxed-rounded-lg boxed-border boxed-shadow px-4">
        {children}
      </div>
    </div>
  )
}

function LanguageSheet({
  onClose,
  current,
  onPick,
}: {
  onClose: () => void
  current?: LangCode
  onPick: (code: LangCode) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop p-5 pb-8 animate-fade-up max-w-app w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">{t('profile.language')}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center bg-surface boxed-border boxed-rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((l) => {
            const active = l.code === current
            return (
              <button
                key={l.code}
                onClick={() => onPick(l.code)}
                className={`flex items-center justify-between p-3.5 transition-all boxed-rounded boxed-border ${active ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-surface text-ink'
                  }`}
              >
                <div className="text-left">
                  <p className="font-black">{l.nativeName}</p>
                  <p className="text-xs font-bold text-ink-muted">{l.englishName}</p>
                </div>
                {active && (
                  <span className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EditProfileSheet({
  onClose,
  driver,
  onSave,
}: {
  onClose: () => void
  driver: any
  onSave: (updated: any) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(driver.name)
  const [phone, setPhone] = useState(driver.phone)
  const [regNumber, setRegNumber] = useState(driver.truck.regNumber)
  const [truckType, setTruckType] = useState(driver.truck.type)
  const [capacity, setCapacity] = useState(driver.truck.capacity)
  const [avatarId, setAvatarId] = useState(driver.avatarId)

  // Unsplash image options for avatars
  const AVATAR_OPTIONS = [
    '1633332755192-727a05c4013d', // Default Guy 1
    '1535713875002-d1d0cf377fde', // Guy 2
    '1570295999919-56ceb5ecca61', // Guy 3
    '1507003211169-0a1dd7228f2d', // Guy 4
  ]

  const TRUCK_TYPES = [
    '19 ft Container',
    '32 ft Container',
    'Open Truck (14 Wheeler)',
    'Dumper Truck',
    'Trailer LPT'
  ]

  function handleSave() {
    onSave({
      name,
      phone,
      avatarId,
      truck: {
        regNumber,
        type: truckType,
        capacity,
      },
    })
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop p-5 pb-8 animate-fade-up max-h-[90%] overflow-y-auto no-scrollbar max-w-app w-full mx-auto font-bold text-ink">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">{t('profile.editProfile')}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center bg-surface boxed-border boxed-rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4 text-left">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-2 font-bold">
              {t('profile.selectAvatar')}
            </label>
            <div className="flex gap-3 justify-start">
              {AVATAR_OPTIONS.map((id) => {
                const active = avatarId === id
                return (
                  <button
                    key={id}
                    onClick={() => setAvatarId(id)}
                    className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${active ? 'border-accent scale-105 shadow-md' : 'border-hairline opacity-75 hover:opacity-100'
                      }`}
                  >
                    <img src={u(id, 120)} alt="" className="h-full w-full object-cover" />
                    {active && (
                      <span className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <span className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={4} />
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editPhone')}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Truck Number */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editTruckNo')}
            </label>
            <input
              type="text"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Truck Type Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editTruckType')}
            </label>
            <select
              value={truckType}
              onChange={(e) => setTruckType(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all cursor-pointer font-bold"
            >
              {TRUCK_TYPES.map((tOpt) => (
                <option key={tOpt} value={tOpt}>{tOpt}</option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editCapacity')}
            </label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleSave}
            className="w-full mt-4 h-12 flex items-center justify-center bg-accent hover:bg-[#E0590E] text-white font-black rounded-xl shadow-glow active:scale-[0.99] transition-all border border-accent"
          >
            {t('profile.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTruckSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (truck: { regNumber: string; type: string; capacity: string }) => void
}) {
  const { t } = useTranslation()
  const [regNumber, setRegNumber] = useState('')
  const [truckType, setTruckType] = useState('19 ft Container')
  const [capacity, setCapacity] = useState('9 Ton')

  const TRUCK_TYPES = [
    '19 ft Container',
    '32 ft Container',
    'Open Truck (14 Wheeler)',
    'Dumper Truck',
    'Trailer LPT'
  ]

  function handleSubmit() {
    if (!regNumber.trim()) return
    onAdd({
      regNumber: regNumber.toUpperCase().trim(),
      type: truckType,
      capacity,
    })
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end font-bold text-ink">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop p-5 pb-8 animate-fade-up max-w-app w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">{t('profile.addTruck')}</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center bg-surface boxed-border boxed-rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4 text-left">
          {/* Truck Number */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editTruckNo')}
            </label>
            <input
              type="text"
              placeholder="e.g. PB10 AB 1234"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all uppercase placeholder:normal-case"
            />
          </div>

          {/* Truck Type Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editTruckType')}
            </label>
            <select
              value={truckType}
              onChange={(e) => setTruckType(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all cursor-pointer font-bold"
            >
              {TRUCK_TYPES.map((tOpt) => (
                <option key={tOpt} value={tOpt}>{tOpt}</option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              {t('profile.editCapacity')}
            </label>
            <input
              type="text"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleSubmit}
            disabled={!regNumber.trim()}
            className="w-full mt-4 h-12 flex items-center justify-center bg-accent hover:bg-[#E0590E] disabled:opacity-55 disabled:pointer-events-none text-white font-black rounded-xl shadow-glow active:scale-[0.99] transition-all border border-accent"
          >
            {t('profile.addTruck')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddDriverSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (drv: { name: string; phone: string; licenseNumber: string }) => void
}) {
  const { driver } = useProfile()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [license, setLicense] = useState('')

  function handleSubmit() {
    if (!name.trim() || !phone.trim() || !license.trim()) return
    onAdd({
      name: name.trim(),
      phone: phone.trim(),
      licenseNumber: license.trim().toUpperCase(),
    })
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end font-bold text-ink">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop p-5 pb-8 animate-fade-up max-w-app w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">Add New Driver</h3>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center bg-surface boxed-border boxed-rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4 text-left">
          {/* Add Myself Helper */}
          <button
            type="button"
            onClick={() => {
              setName(driver.name)
              setPhone(driver.phone)
              setLicense(driver.documents.license.id)
            }}
            className="w-full py-2.5 bg-accent-soft hover:bg-[#ffe8d6] border border-dashed border-accent rounded-xl text-xs font-black text-accent transition-colors flex items-center justify-center gap-1.5 active:scale-[0.99]"
          >
            <Users size={14} /> Add Myself as Driver
          </button>

          {/* Driver Name */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              Driver Name
            </label>
            <input
              type="text"
              placeholder="e.g. Vikram Singh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all"
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
              Driving License Number
            </label>
            <input
              type="text"
              placeholder="e.g. DL-14201234567"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="w-full h-12 px-4 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white focus:ring-2 focus:ring-accent/40 outline-none transition-all uppercase"
            />
          </div>

          {/* Action button */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim() || !license.trim()}
            className="w-full mt-4 h-12 flex items-center justify-center bg-accent hover:bg-[#E0590E] disabled:opacity-55 disabled:pointer-events-none text-white font-black rounded-xl shadow-glow active:scale-[0.99] transition-all border border-accent"
          >
            Add Driver
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentModal({
  type,
  onClose,
}: {
  type: 'rc' | 'license' | 'permit'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { driver, updateDriver } = useProfile()
  const [isEditing, setIsEditing] = useState(false)

  const isLicense = type === 'license'
  const isRc = type === 'rc'

  const currentDoc = driver.documents[type]
  const [docId, setDocId] = useState(currentDoc.id)
  const [docValidity, setDocValidity] = useState(currentDoc.validity)

  function handleSaveCard() {
    const updatedDocs = {
      ...driver.documents,
      [type]: { id: docId, validity: docValidity }
    }
    // Sync truck reg number if updating RC
    const updatedTruck = type === 'rc' ? { ...driver.truck, regNumber: docId } : undefined

    updateDriver({
      documents: updatedDocs,
      ...(updatedTruck ? { truck: updatedTruck } : {})
    })
    setIsEditing(false)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1.5px]" onClick={onClose} />

      {/* Card Sheet */}
      <div className="relative bg-surface border-t border-hairline rounded-t-[32px] shadow-pop p-5 pb-8 animate-slide-up safe-bottom shrink-0 max-w-app w-full mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <h3 className="text-sm font-black text-ink uppercase tracking-wider">
              {isLicense ? 'Verified Driver Licence' : isRc ? 'Registration Certificate' : 'National Carriage Permit'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center bg-surface-grey hover:bg-surface-sunken border border-hairline rounded-lg transition-colors"
          >
            <X size={16} strokeWidth={2.5} className="text-ink-muted" />
          </button>
        </div>

        {/* The Card Mockup */}
        {isLicense && (
          <div className="w-full h-[210px] rounded-2xl bg-gradient-to-tr from-[#1E40AF] via-[#3B82F6] to-[#60A5FA] p-4 text-white relative shadow-lg overflow-hidden border border-white/20 select-none">
            {/* Hologram Circle */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/20 pb-2">
              <div>
                <p className="text-[9px] font-black tracking-wider uppercase opacity-90 text-left">Driving Licence - Republic of India</p>
                <p className="text-[7px] font-bold opacity-60 text-left font-semibold">MINISTRY OF ROAD TRANSPORT & HIGHWAYS</p>
              </div>
              <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded border border-white/30">Verified</span>
            </div>

            {/* Content area */}
            <div className="mt-3 flex gap-3.5 items-start">
              {/* Chip & Photo */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* Micro SIM Chip */}
                <div className="w-8 h-6 rounded bg-yellow-400 border border-yellow-500 flex flex-col justify-between p-1 shadow-inner opacity-90">
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                </div>
                <img
                  src={u(driver.avatarId, 160)}
                  alt=""
                  className="h-14 w-12 rounded bg-white/10 border border-white/20 object-cover"
                />
              </div>

              {/* Text Fields */}
              <div className="flex-1 text-[10px] font-bold space-y-1.5 min-w-0 text-left">
                <div>
                  <p className="text-[8px] opacity-60 leading-none">LICENCE NO.</p>
                  <p className="tracking-wide text-white truncate font-extrabold text-[11px]">{driver.documents.license.id}</p>
                </div>
                <div>
                  <p className="text-[8px] opacity-60 leading-none">NAME</p>
                  <p className="text-white truncate font-extrabold text-[11px]">{driver.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">COV</p>
                    <p className="text-white font-extrabold">LMV, TRANS</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">VALID TILL</p>
                    <p className="text-white font-extrabold">{driver.documents.license.validity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer stamp/authority */}
            <div className="absolute bottom-3 right-4 text-right">
              <p className="text-[6px] opacity-50">ISSUING AUTHORITY</p>
              <p className="text-[8px] font-black tracking-wider opacity-85">RTO LUDHIANA, PUNJAB</p>
            </div>
          </div>
        )}

        {isRc && (
          <div className="w-full h-[210px] rounded-2xl bg-gradient-to-tr from-[#9F1239] via-[#E11D48] to-[#FB7185] p-4 text-white relative shadow-lg overflow-hidden border border-white/20 select-none">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/20 pb-2">
              <div>
                <p className="text-[9px] font-black tracking-wider uppercase opacity-90 text-left">Registration Certificate - Punjab State</p>
                <p className="text-[7px] font-bold opacity-60 text-left font-semibold">DEPARTMENT OF TRANSPORT PUNJAB</p>
              </div>
              <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded border border-white/30">Verified</span>
            </div>

            {/* Content area */}
            <div className="mt-3 flex gap-3.5 items-start">
              {/* Chip */}
              <div className="shrink-0">
                <div className="w-8 h-6 rounded bg-yellow-400 border border-yellow-500 flex flex-col justify-between p-1 shadow-inner opacity-90">
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                  <div className="h-[2px] w-full bg-yellow-600/30" />
                </div>
              </div>

              {/* Text Fields */}
              <div className="flex-1 text-[10px] font-bold space-y-1.5 min-w-0 text-left">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">REGISTRATION NO.</p>
                    <p className="tracking-wide text-white font-extrabold text-[11px]">{driver.documents.rc.id}</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">OWNER NAME</p>
                    <p className="text-white font-extrabold truncate text-[11px]">{driver.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">CHASSIS NO.</p>
                    <p className="text-white truncate font-medium">MAT403819A0284</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">VEHICLE CLASS</p>
                    <p className="text-white font-extrabold">{driver.truck.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">MAKER / MODEL</p>
                    <p className="text-white font-bold truncate">TATA LPT 1613</p>
                  </div>
                  <div>
                    <p className="text-[7px] opacity-60 leading-none">TAX VALID UPTO</p>
                    <p className="text-white font-extrabold">{driver.documents.rc.validity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Authority */}
            <div className="absolute bottom-3 right-4 text-right">
              <p className="text-[6px] opacity-50">REGISTERING AUTHORITY</p>
              <p className="text-[8px] font-black tracking-wider opacity-85">DLA LUDHIANA WEST, PUNJAB</p>
            </div>
          </div>
        )}

        {!isLicense && !isRc && (
          <div className="w-full h-[210px] rounded-2xl bg-gradient-to-tr from-[#111827] via-[#1F2937] to-[#374151] p-4 text-white relative shadow-lg overflow-hidden border border-white/20 select-none">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/20 pb-2">
              <div>
                <p className="text-[9px] font-black tracking-wider uppercase opacity-90 text-left">National Permit for Goods Carriage</p>
                <p className="text-[7px] font-bold opacity-60 text-left font-semibold">REPUBLIC OF INDIA STATE TRANSPORT AUTHORITY</p>
              </div>
              <span className="text-[8px] font-black bg-white/20 px-2 py-0.5 rounded border border-white/30">Verified</span>
            </div>

            {/* Details */}
            <div className="mt-3.5 space-y-2 text-[10px] font-bold text-left">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[7px] opacity-60 leading-none">PERMIT NUMBER</p>
                  <p className="text-white font-extrabold text-[11px] tracking-wide">{driver.documents.permit.id}</p>
                </div>
                <div>
                  <p className="text-[7px] opacity-60 leading-none">VEHICLE REGISTRATION</p>
                  <p className="text-white font-extrabold text-[11px]">{driver.documents.rc.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[7px] opacity-60 leading-none">VALID STATES</p>
                  <p className="text-white font-extrabold uppercase">All India Permit</p>
                </div>
                <div>
                  <p className="text-[7px] opacity-60 leading-none">VALIDITY PERIOD</p>
                  <p className="text-white font-extrabold">{driver.documents.permit.validity}</p>
                </div>
              </div>

              <div>
                <p className="text-[7px] opacity-60 leading-none">HOLDER</p>
                <p className="text-white font-extrabold">{driver.name} (BFC Elite Driver)</p>
              </div>
            </div>

            {/* Footer Authority */}
            <div className="absolute bottom-3 right-4 text-right">
              <p className="text-[6px] opacity-50">ISSUING COMMISSION</p>
              <p className="text-[8px] font-black opacity-85">STA AUTHORITY CHANDIGARH</p>
            </div>
          </div>
        )}

        {/* Card Document Editor Panel */}
        <div className="mt-6 border-t border-hairline pt-4 text-left font-bold text-ink">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-1.5 h-11 bg-surface-grey hover:bg-surface-sunken border border-hairline font-extrabold text-ink text-sm rounded-xl active:scale-[0.99] transition-all"
            >
              <FileText size={16} className="text-ink-muted" />
              <span>{t('profile.editCardDetails')}</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
                    {t('profile.cardNo')}
                  </label>
                  <input
                    type="text"
                    value={docId}
                    onChange={(e) => setDocId(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white outline-none transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-ink-muted mb-1.5 font-bold">
                    {t('profile.validityDate')}
                  </label>
                  <input
                    type="text"
                    value={docValidity}
                    onChange={(e) => setDocValidity(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-grey font-bold text-ink rounded-xl border border-hairline focus:bg-white outline-none transition-all text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 bg-surface hover:bg-surface-grey border border-hairline font-bold text-ink-muted text-sm rounded-xl transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveCard}
                  className="flex-1 h-11 bg-accent hover:bg-[#E0590E] border border-accent font-black text-white text-sm rounded-xl transition-all"
                >
                  {t('profile.saveCard')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
