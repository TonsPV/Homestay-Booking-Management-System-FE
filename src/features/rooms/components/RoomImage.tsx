import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
} from 'react'

import { cn } from '@/shared/components/cn'

interface RoomImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fallbackLabel?: string
  src?: string
}

export function RoomImage({
  alt,
  className,
  fallbackLabel = 'Ảnh chưa hiển thị được',
  src,
  ...props
}: RoomImageProps) {
  const [failed, setFailed] = useState(!src)

  useEffect(() => {
    setFailed(!src)
  }, [src])

  if (failed) {
    return (
      <div
        aria-label={alt || undefined}
        className={cn(
          'grid place-items-center bg-surface-muted px-4 text-center text-sm font-semibold text-muted',
          className,
        )}
        role={alt ? 'img' : undefined}
      >
        <span aria-hidden={alt ? 'true' : undefined}>{fallbackLabel}</span>
      </div>
    )
  }

  return (
    <img
      {...props}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      src={src}
    />
  )
}
