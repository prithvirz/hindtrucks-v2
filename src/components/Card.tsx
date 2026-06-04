import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export default function Card({ children, padded = true, className = '', ...rest }: Props) {
  return (
    <div
      className={`bg-surface boxed-rounded-lg boxed-border boxed-shadow ${
        padded ? 'p-4' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

