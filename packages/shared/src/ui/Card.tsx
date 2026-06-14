import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Adds the soft elevation shadow. */
  raised?: boolean
}

export default function Card({ children, raised, className = '', ...rest }: Props) {
  return (
    <div
      className={`bg-surface boxed-border boxed-rounded ${raised ? 'boxed-shadow' : 'boxed-shadow-sm'} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
