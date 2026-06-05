import type { ReactNode } from 'react'

/**
 * Responsive layout container. On mobile viewports it fills the entire screen.
 * On desktop and tablet viewports, it centers the application within a clean,
 * modern card container with rounded corners and a premium drop shadow, set against
 * a subtle ambient backdrop gradient.
 */
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-canvas flex items-center justify-center relative overflow-x-hidden">
      {/* Branded ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,#151821_0%,#0C0E14_60%,#08090C_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 hidden sm:block h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 hidden sm:block h-80 w-80 rounded-full bg-info/10 blur-3xl" />

      {/* Main responsive container */}
      <div className="relative z-10 w-full max-w-[430px] h-[100dvh] sm:h-[820px] sm:max-h-[90vh] bg-surface-grey sm:rounded-[2.5rem] sm:shadow-pop border border-transparent sm:border-white/5 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}

