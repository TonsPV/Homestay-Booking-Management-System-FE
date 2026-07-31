import type { ReactNode } from 'react'

import { cn } from './cn'

type BadgeTone = 'amber' | 'blue' | 'emerald' | 'rose' | 'slate' | 'violet'

interface BadgeProps {
  children: ReactNode
  className?: string
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  amber: 'bg-warning-soft text-warning',
  blue: 'bg-brand-soft text-brand-strong',
  emerald: 'bg-success-soft text-success',
  rose: 'bg-danger-soft text-danger-strong',
  slate: 'bg-surface-muted text-ink',
  violet: 'bg-violet-100 text-violet-800',
}

export function Badge({
  children,
  className,
  tone = 'slate',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
