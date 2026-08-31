import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

/* FilterBar — management list filter surface (design grammar v3).
 * Mobile stacks, desktop aligns fields and actions to the end. Apply is
 * primary, Reset is outline/text, extra queue links go into MoreActions. */

interface FilterBarRootProps extends FormHTMLAttributes<HTMLFormElement> {
  'aria-label': string
  children: ReactNode
}

function FilterBarRoot({ className, ...props }: FilterBarRootProps) {
  return (
    <form
      role="search"
      {...props}
      className={cn(
        'grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-card sm:flex sm:flex-wrap sm:items-end',
        className,
      )}
    />
  )
}

function Fields({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-wrap',
        className,
      )}
    />
  )
}

function Actions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('flex shrink-0 items-end gap-2', className)}
    />
  )
}

function MoreActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('ml-auto flex items-end gap-2', className)}
    />
  )
}

export const FilterBar = Object.assign(FilterBarRoot, {
  Actions,
  Fields,
  MoreActions,
})

