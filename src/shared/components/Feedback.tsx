import type { ReactNode } from 'react'

import { Button } from './Button'
import { Card } from './Card'
import { cn } from './cn'

type AlertTone = 'error' | 'info' | 'success' | 'warning'

interface AlertProps {
  children: ReactNode
  className?: string
  title?: string
  tone?: AlertTone
}

const alertClasses: Record<AlertTone, string> = {
  error: 'border-danger/20 bg-danger-soft text-danger-strong',
  info: 'border-info/20 bg-info-soft text-info',
  success: 'border-success/20 bg-success-soft text-success',
  warning: 'border-warning/20 bg-warning-soft text-warning',
}

export function Alert({
  children,
  className,
  title,
  tone = 'info',
}: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-card border px-4 py-3 text-sm leading-body',
        alertClasses[tone],
        className,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {title ? <p className="mb-1 font-bold">{title}</p> : null}
      {children}
    </div>
  )
}

interface LoadingStateProps {
  label?: string
}

export function LoadingState({
  label = 'Đang tải dữ liệu…',
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-48 items-center justify-center gap-3 text-sm font-medium text-muted"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-brand border-r-transparent"
      />
      {label}
    </div>
  )
}

interface EmptyStateProps {
  action?: ReactNode
  description: string
  title: string
}

export function EmptyState({
  action,
  description,
  title,
}: EmptyStateProps) {
  return (
    <Card className="py-12 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-surface-muted text-muted"
      >
        <span className="h-5 w-5 rounded-md border-2 border-current" />
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}

interface ErrorStateProps {
  description?: string
  onRetry?: () => void
  title?: string
}

export function ErrorState({
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  title = 'Không thể tải nội dung',
}: ErrorStateProps) {
  return (
    <Card
      aria-live="assertive"
      className="border-danger/20 bg-danger-soft py-10 text-center"
      role="alert"
    >
      <h2 className="text-lg font-bold text-danger-strong">{title}</h2>
      <p className="mt-2 text-sm text-danger">{description}</p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="outline">
          Thử lại
        </Button>
      ) : null}
    </Card>
  )
}
