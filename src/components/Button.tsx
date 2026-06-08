import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'white' | 'outline' | 'danger'
type Size = 'xl' | 'lg' | 'md' | 'sm' | 'xs'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
  loading?: boolean
}

const base =
  'inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border font-extrabold tracking-normal leading-tight transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-press shadow-sm shadow-accent/15',
  secondary: 'bg-accent-soft text-accent border-accent/25 hover:bg-[#ffe8d6]',
  ghost: 'bg-surface text-ink border-hairline hover:bg-surface-grey',
  dark: 'bg-night-900 text-white border-night-900 hover:bg-night-800 shadow-sm shadow-black/10',
  white: 'bg-white text-night-900 border-hairline hover:bg-surface-grey shadow-sm',
  outline: 'bg-transparent text-ink border-hairline hover:bg-surface-grey',
  danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-sm shadow-red-500/15',
}

const sizes: Record<Size, string> = {
  xl: 'h-14 px-6 text-base',
  lg: 'h-12 px-5 text-sm',
  md: 'h-11 px-4 text-sm',
  sm: 'h-9 px-3 text-xs',
  xs: 'h-8 px-2.5 text-[11px]',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  full,
  leftIcon,
  rightIcon,
  children,
  loading,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span className="min-w-0 max-w-full text-center break-words">{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
