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
    <nav className="absolute bottom-0 inset-x-4 z-20 bg-surface/80 border border-hairline rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
      <ul className="grid grid-cols-4 py-1.5 px-1">
        {TABS.map(({ to, icon: Icon, key }) => (
          <li key={key} className="relative">
            <NavLink
              id={`nav-tab-${key}`}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 rounded-[18px] transition-all ${isActive ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent' : 'text-ink-faint'} />
                  <span className={`text-[9.5px] uppercase tracking-wider ${isActive ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
                    {t(`tabs.${key}`)}
                  </span>
                </>
              )}
            </NavLink>
            {/* Notification badge on profile tab */}
            {key === 'profile' && unreadPushCount > 0 && (
              <span className="absolute top-1.5 right-4.5 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm">
                {unreadPushCount > 99 ? '99+' : unreadPushCount}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
