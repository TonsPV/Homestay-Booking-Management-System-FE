import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react'

import { cn } from './cn'

/* Table — management data table family (design grammar v3).
 * Wrapper provides the rounded surface, border, shadow and horizontal
 * scroller. Header/body/row/cell components carry the density contract so
 * screens don't restyle tables locally. */

interface TableProps extends HTMLAttributes<HTMLDivElement> {
  caption: string
  children: ReactNode
  minW?: string
}

export function Table({
  caption,
  children,
  className,
  minW = '64rem',
  ...props
}: TableProps) {
  return (
    <div
      {...props}
      className={cn(
        'overflow-x-auto rounded-panel border border-line bg-surface shadow-card',
        className,
      )}
    >
      <table
        className={cn(
          'w-full border-collapse text-left text-sm',
          minW.startsWith('min-w-') ? minW : `min-w-[${minW}]`,
        )}
      >
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={cn(
        'bg-surface-muted text-xs uppercase tracking-wide text-muted',
        className,
      )}
    />
  )
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...props} className={cn('divide-y divide-line', className)} />
  )
}

export function TableTr({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn('align-top hover:bg-surface-muted', className)}
    />
  )
}

export function TableTh({
  className,
  scope = 'col',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn('px-4 py-3 font-semibold', className)}
      scope={scope}
    />
  )
}

export function TableTd({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn('px-4 py-3', className)} />
}
