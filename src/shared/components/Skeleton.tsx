import type { HTMLAttributes } from 'react'

import { cn } from './cn'

type SkeletonVariant = 'block' | 'card' | 'line'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
}

const variantClasses: Record<SkeletonVariant, string> = {
  block: 'aspect-[4/3] rounded-panel',
  card: 'min-h-48 rounded-panel',
  line: 'h-4 rounded-control',
}

export function Skeleton({
  className,
  variant = 'line',
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn(
        'bg-surface-muted motion-safe:animate-pulse',
        variantClasses[variant],
        className,
      )}
    />
  )
}
