import type { ReactNode } from 'react'

/**
 * Responsive layout container. On mobile it fills the screen; on desktop/tablet
 * it centers the app in a premium rounded card against an ambient backdrop.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-viewport w-full bg-canvas flex items-center justify-center relative overflow-hidden sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,#151821_0%,#0C0E14_60%,#08090C_100%)]" />
      <div className="app-shell relative z-10 w-full max-w-[430px] bg-surface-grey sm:rounded-[2rem] sm:shadow-pop border-0 sm:border sm:border-white/5 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}
