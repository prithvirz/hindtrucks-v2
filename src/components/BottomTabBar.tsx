import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Boxes, Wallet, User } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useChatContext } from '../state/ChatContext'
import { PaghriPersonIcon } from '../features/chatbot/components/ChatDrawer'

export default function BottomTabBar() {
  const { t } = useTranslation()
  const { unreadCount } = useNotifications()
  const { toggleChat, isOpen: isChatOpen } = useChatContext()

  return (
    <nav
      className="absolute z-20 bg-surface/90 border border-hairline rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl overflow-hidden"
      style={{
        left: 'max(1rem, var(--safe-left))',
        right: 'max(1rem, var(--safe-right))',
        bottom: 'calc(var(--safe-bottom) + 0.5rem)',
      }}
    >
      <ul className="grid grid-cols-5 py-1.5 px-1 items-center">
        {/* 1. Home */}
        <li className="relative">
          <NavLink
            id="nav-tab-home"
            to="/home"
            className={({ isActive }) =>
              `min-h-14 flex flex-col items-center justify-center gap-1 py-2 rounded-[18px] transition-all ${isActive && !isChatOpen ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home size={20} strokeWidth={isActive && !isChatOpen ? 2.5 : 2} className={isActive && !isChatOpen ? 'text-accent' : 'text-ink-faint'} />
                <span className={`max-w-full truncate text-[10px] uppercase ${isActive && !isChatOpen ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
                  {t('tabs.home')}
                </span>
              </>
            )}
          </NavLink>
        </li>

        {/* 2. Loads */}
        <li className="relative">
          <NavLink
            id="nav-tab-loads"
            to="/loads"
            className={({ isActive }) =>
              `min-h-14 flex flex-col items-center justify-center gap-1 py-2 rounded-[18px] transition-all ${isActive && !isChatOpen ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Boxes size={20} strokeWidth={isActive && !isChatOpen ? 2.5 : 2} className={isActive && !isChatOpen ? 'text-accent' : 'text-ink-faint'} />
                <span className={`max-w-full truncate text-[10px] uppercase ${isActive && !isChatOpen ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
                  {t('tabs.loads')}
                </span>
              </>
            )}
          </NavLink>
        </li>

        {/* 3. Raahgir (AI Chatbot) */}
        <li className="relative">
          <button
            id="nav-tab-raahgir"
            onClick={toggleChat}
            className={`w-full min-h-14 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-[18px] transition-all select-none outline-none ${isChatOpen ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
              }`}
            aria-label="Raahgir Driver Assistant"
          >
            <PaghriPersonIcon className={`w-7 h-7 transition-transform duration-200 ${isChatOpen ? 'scale-105' : 'hover:scale-105'}`} />
            <span className={`max-w-full truncate text-[10px] uppercase ${isChatOpen ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
              {t('tabs.raahgir', 'Raahgir')}
            </span>
          </button>
        </li>

        {/* 4. Earnings */}
        <li className="relative">
          <NavLink
            id="nav-tab-earnings"
            to="/earnings"
            className={({ isActive }) =>
              `min-h-14 flex flex-col items-center justify-center gap-1 py-2 rounded-[18px] transition-all ${isActive && !isChatOpen ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Wallet size={20} strokeWidth={isActive && !isChatOpen ? 2.5 : 2} className={isActive && !isChatOpen ? 'text-accent' : 'text-ink-faint'} />
                <span className={`max-w-full truncate text-[10px] uppercase ${isActive && !isChatOpen ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
                  {t('tabs.earnings')}
                </span>
              </>
            )}
          </NavLink>
        </li>

        {/* 5. Profile */}
        <li className="relative">
          <NavLink
            id="nav-tab-profile"
            to="/profile"
            className={({ isActive }) =>
              `min-h-14 flex flex-col items-center justify-center gap-1 py-2 rounded-[18px] transition-all ${isActive && !isChatOpen ? 'text-accent bg-accent/10' : 'text-ink-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <User size={20} strokeWidth={isActive && !isChatOpen ? 2.5 : 2} className={isActive && !isChatOpen ? 'text-accent' : 'text-ink-faint'} />
                <span className={`max-w-full truncate text-[10px] uppercase ${isActive && !isChatOpen ? 'font-black text-accent' : 'font-semibold text-ink-faint'}`}>
                  {t('tabs.profile')}
                </span>
              </>
            )}
          </NavLink>
          {/* Notification badge on profile tab */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-3 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1 shadow-sm pointer-events-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
