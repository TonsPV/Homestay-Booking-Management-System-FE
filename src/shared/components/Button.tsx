import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from './cn'

type ButtonVariant = 'danger' | 'outline' | 'primary' | 'secondary' | 'text'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger-strong focus-visible:outline-danger',
  outline:
    'border border-line bg-surface text-ink shadow-sm hover:border-muted/60 hover:bg-surface-muted focus-visible:outline-ink',
  primary:
    'bg-brand text-white shadow-sm hover:bg-brand-strong focus-visible:outline-brand',
  secondary:
    'bg-ink text-white shadow-sm hover:bg-ink/90 focus-visible:outline-ink',
  text: 'text-brand-strong hover:bg-brand-soft focus-visible:outline-brand',
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2.5 text-sm font-semibold transition duration-fast ease-calm active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0 motion-reduce:transition-none',
        variantClasses[variant],
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  )
}
