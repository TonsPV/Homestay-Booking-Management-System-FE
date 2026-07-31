import {
  cloneElement,
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { cn } from './cn'

interface FieldProps {
  children: ReactElement<{
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-required'?: boolean
    id?: string
    required?: boolean
  }>
  error?: string
  hint?: string
  label: string
  required?: boolean
}

const controlClasses =
  'min-h-11 w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-elevation-1 outline-none transition duration-fast ease-calm placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand-soft disabled:cursor-not-allowed disabled:bg-surface-muted motion-reduce:transition-none'

export function Field({
  children,
  error,
  hint,
  label,
  required = false,
}: FieldProps) {
  const generatedId = useId()
  const controlId = children.props.id ?? generatedId
  const descriptionId = `${controlId}-description`
  const describedBy = [
    children.props['aria-describedby'],
    error || hint ? descriptionId : undefined,
  ]
    .filter(Boolean)
    .join(' ')
  const control = cloneElement(children, {
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? true : children.props['aria-invalid'],
    'aria-required': required ? true : children.props['aria-required'],
    id: controlId,
    required: required || children.props.required,
  })

  return (
    <div className="grid gap-1.5">
      <label
        className="text-sm font-semibold text-ink"
        htmlFor={controlId}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      {control}
      {error ? (
        <span
          className="text-sm text-danger"
          id={descriptionId}
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-muted" id={descriptionId}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClasses, className)} {...props} />
})

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlClasses, className)} {...props} />
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlClasses, 'min-h-28 resize-y', className)}
      {...props}
    />
  )
})
