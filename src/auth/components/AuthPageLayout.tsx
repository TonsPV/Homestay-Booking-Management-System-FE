import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthPageLayoutProps {
  children: ReactNode
  description: string
  eyebrow: string
  homePath?: string
  title: string
}

export function AuthPageLayout({
  children,
  description,
  eyebrow,
  homePath = '/',
  title,
}: AuthPageLayoutProps) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="relative rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-9 lg:p-10"
    >
      <Link
        className="sr-only rounded-lg bg-brand px-3 py-2 font-bold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        to={homePath}
      >
        Về trang chủ
      </Link>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
        {eyebrow}
      </p>
      <h1
        className="mt-2 text-3xl font-black tracking-tight text-ink"
        id={titleId}
      >
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      <div className="mt-8">{children}</div>
    </section>
  )
}
