import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cn } from './cn'

type IconButtonVariant = 'ghost' | 'inverse-ghost' | 'outline'
type IconButtonSize = 'md' | 'sm'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  children?: ReactNode
  loading?: boolean
  size?: IconButtonSize
  variant?: IconButtonVariant
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-ink hover:bg-surface-muted',
  'inverse-ghost':
    'bg-transparent text-on-inverse-muted hover:bg-inverse-raised hover:text-on-inverse',
  outline:
    'border border-line bg-surface text-ink hover:border-muted/60 hover:bg-surface-muted',
}

const sizeClasses: Record<IconButtonSize, string> = {
  md: 'size-11',
  sm: 'size-9',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      children,
      className,
      disabled,
      loading = false,
      size = 'md',
      type = 'button',
      variant = 'ghost',
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full transition duration-fast ease-calm active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0 motion-reduce:transition-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
        ) : (
          children
        )}
      </button>
    )
  },
)
