import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface PageHeaderProps {
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  description?: string
  eyebrow?: string
  title: string
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-1">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1

          return (
            <li className="flex min-w-0 items-center gap-2" key={index}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-muted">
                  ›
                </span>
              ) : null}
              {isCurrent || !item.to ? (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className="truncate text-muted"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  className="truncate font-medium text-muted underline-offset-4 hover:text-brand hover:underline"
                  to={item.to}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function PageHeader({
  actions,
  breadcrumbs,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
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
