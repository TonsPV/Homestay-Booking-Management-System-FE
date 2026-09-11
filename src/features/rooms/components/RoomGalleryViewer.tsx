import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { RoomImage } from './RoomImage'
import { resolveRoomImageUrl } from '../image-url'
import type { RoomImage as RoomImageDto } from '../types'

interface RoomGalleryViewerProps {
  images: RoomImageDto[]
  initialIndex: number
  onClose: () => void
  roomName: string
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Fullscreen image viewer for the client room detail page (CLIENT-01).
 * Owns a modal dialog over the page: prev/next, keyboard arrows, Escape to
 * close, focus restoration to the opener, and a zoom toggle for the large
 * image. Renders only public room images.
 */
export function RoomGalleryViewer({
  images,
  initialIndex,
  onClose,
  roomName,
}: RoomGalleryViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const current = images[index]
  const total = images.length

  const goPrevious = useCallback(() => {
    setZoomed(false)
    setIndex((value) => (value - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setZoomed(false)
    setIndex((value) => (value + 1) % total)
  }, [total])

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>('[data-viewer-close]')
        ?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrevious()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrevious, onClose])

  if (!current) {
    return null
  }

  const handleTabKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  const viewerContent: ReactNode = (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-ink/85 p-3 sm:p-6">
      <div
        aria-label={`Xem ảnh ${roomName}`}
        aria-modal="true"
        className="flex size-full flex-col outline-none"
        onKeyDown={handleTabKey}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-3 px-1 pb-3">
          <p className="text-sm font-semibold text-white">
            {index + 1} / {total}
          </p>
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-white/25 text-white transition duration-fast ease-calm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-viewer-close
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center gap-2">
          {total > 1 ? (
            <button
              aria-label="Ảnh trước"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-white/25 text-white transition duration-fast ease-calm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={goPrevious}
              type="button"
            >
              ←
            </button>
          ) : null}

          <button
            aria-label={
              zoomed ? 'Thu nhỏ ảnh' : 'Phóng to ảnh'
            }
            className={`flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-panel bg-ink/40 ${
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setZoomed((value) => !value)}
            type="button"
          >
            <RoomImage
              alt={`Ảnh ${index + 1} của ${roomName}`}
              className={
                zoomed
                  ? 'max-h-none min-h-full w-full object-contain'
                  : 'max-h-full object-contain'
              }
              decoding="async"
              src={resolveRoomImageUrl(current.imageUrl)}
            />
          </button>

          {total > 1 ? (
            <button
              aria-label="Ảnh sau"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control border border-white/25 text-white transition duration-fast ease-calm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={goNext}
              type="button"
            >
              →
            </button>
          ) : null}
        </div>

        {total > 1 ? (
          <div
            aria-label="Chọn ảnh trong bộ xem"
            className="flex justify-center gap-2 overflow-x-auto pb-1 pt-3"
            role="group"
          >
            {images.map((image, imageIndex) => (
              <button
                aria-label={`Xem ảnh ${imageIndex + 1} của ${roomName}`}
                aria-pressed={imageIndex === index}
                className={`aspect-square size-14 shrink-0 overflow-hidden rounded-control border-2 transition duration-fast ease-calm ${
                  imageIndex === index
                    ? 'border-white'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                key={image.id}
                onClick={() => {
                  setZoomed(false)
                  setIndex(imageIndex)
                }}
                type="button"
              >
                <RoomImage
                  alt=""
                  className="size-full object-cover"
                  decoding="async"
                  src={resolveRoomImageUrl(image.imageUrl)}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(viewerContent, document.body)
}
