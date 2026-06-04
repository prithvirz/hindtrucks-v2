import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Boxes, Wallet, User, type LucideIcon } from 'lucide-react'
import { useShell } from '../state/ShellContext'

interface Tab {
  to: string
  icon: LucideIcon
  key: string
}

const TABS: Tab[] = [
  { to: '/home', icon: Home, key: 'home' },
  { to: '/loads', icon: Boxes, key: 'loads' },
  { to: '/earnings', icon: Wallet, key: 'earnings' },
  { to: '/profile', icon: User, key: 'profile' },
]

export default function BottomTabBar() {
  const { t } = useTranslation()
  const { unreadPushCount } = useShell()
  return (
    <nav className="absolute bottom-0 inset-x-0 z-20 bg-surface/85 backdrop-blur-xl border-t border-hairline safe-bottom shadow-[0_-4px_24px_rgba(11,11,15,0.05)]">
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, icon: Icon, key }) => (
          <li key={key} className="relative">
            <NavLink
              id={`nav-tab-${key}`}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 transition ${isActive ? 'text-accent' : 'text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent' : 'text-ink-faint'} />
                  <span className={`text-[11px] ${isActive ? 'font-bold text-accent' : 'font-medium text-ink-faint'}`}>
                    {t(`tabs.${key}`)}
                  </span>
                </>
              )}
            </NavLink>
            {/* Notification badge on profile tab */}
            {key === 'profile' && unreadPushCount > 0 && (
              <span className="absolute top-1 right-3 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-sm">
                {unreadPushCount > 99 ? '99+' : unreadPushCount}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
