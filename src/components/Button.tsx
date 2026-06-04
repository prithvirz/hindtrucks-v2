import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'lg' | 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 font-bold tracking-tight rounded-xl boxed-btn-active transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-accent hover:bg-accent-press active:shadow-card',
  secondary: 'bg-accent-soft text-accent hover:bg-[#ffe8d6]',
  ghost: 'bg-surface text-ink ring-1 ring-hairline shadow-xs hover:bg-surface-grey',
  dark: 'bg-night-900 text-white shadow-card hover:bg-black',
}


const sizes: Record<Size, string> = {
  lg: 'h-14 px-6 text-[16px]',
  md: 'h-12 px-5 text-[15px]',
  sm: 'h-10 px-4 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  full,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}

