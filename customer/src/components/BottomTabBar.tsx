import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus, ClipboardList, User } from 'lucide-react'

const tabs = [
  { to: '/book', icon: PackagePlus, key: 'book' },
  { to: '/bookings', icon: ClipboardList, key: 'bookings' },
  { to: '/profile', icon: User, key: 'profile' },
] as const

export default function BottomTabBar() {
  const { t } = useTranslation()
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-hairline bg-surface/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-app items-stretch justify-around px-2 pt-2">
        {tabs.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={key}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition-colors ${
                isActive ? 'text-accent' : 'text-ink-faint hover:text-ink-muted'
              }`
            }
          >
            <Icon className="h-6 w-6" strokeWidth={2.1} />
            <span>{t(`tabs.${key}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
