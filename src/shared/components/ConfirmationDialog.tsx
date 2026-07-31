import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { Button } from './Button'

interface ConfirmationDialogProps {
  busy?: boolean
  cancelLabel?: string
  children?: ReactNode
  confirmDisabled?: boolean
  confirmLabel: string
  description?: ReactNode
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
  tone?: 'danger' | 'primary'
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ConfirmationDialog({
  busy = false,
  cancelLabel = 'Hủy',
  children,
  confirmDisabled = false,
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  open,
  title,
  tone = 'danger',
}: ConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const busyRef = useRef(busy)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    busyRef.current = busy
  }, [busy])

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    if (!open) {
      return
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>('[data-dialog-cancel]')
        ?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!busyRef.current) {
          onCancelRef.current()
        }
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current
      if (!dialog) {
        return
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute('hidden') &&
          element.getAttribute('aria-hidden') !== 'true',
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      const activeElement = document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement || !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement?.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || !dialog.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [open])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-overlay p-4"
    >
      <div
        ref={dialogRef}
        aria-busy={busy || undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-panel bg-surface shadow-elevation-4"
        role="dialog"
        tabIndex={-1}
      >
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-ink" id={titleId}>
            {title}
          </h2>
          {description ? (
            <div
              className="mt-1 text-sm leading-body text-muted"
              id={descriptionId}
            >
              {description}
            </div>
          ) : null}
        </div>

        {children ? (
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-surface-muted px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            data-dialog-cancel
            disabled={busy}
            onClick={onCancel}
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <Button
            disabled={confirmDisabled}
            loading={busy}
            onClick={onConfirm}
            variant={tone}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
