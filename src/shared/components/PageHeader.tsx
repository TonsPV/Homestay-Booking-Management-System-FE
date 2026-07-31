import type { ReactNode } from 'react'

interface PageHeaderProps {
  actions?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
