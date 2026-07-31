import { Link, type LinkProps } from 'react-router-dom'

import { cn } from './cn'

type LinkButtonVariant = 'outline' | 'primary' | 'secondary'

interface LinkButtonProps extends LinkProps {
  variant?: LinkButtonVariant
}

const variantClasses: Record<LinkButtonVariant, string> = {
  outline:
    'border border-line bg-surface text-ink hover:border-muted/60 hover:bg-surface-muted',
  primary: 'bg-brand text-white hover:bg-brand-strong',
  secondary: 'bg-ink text-white hover:bg-ink/90',
}

export function LinkButton({
  className,
  variant = 'primary',
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2.5 text-sm font-semibold shadow-elevation-1 transition duration-fast ease-calm active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
