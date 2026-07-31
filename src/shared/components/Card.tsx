import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-panel border border-line bg-surface p-5 shadow-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
