import { useMemo, type ChangeEvent } from 'react'

import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Field, Input } from '@/shared/components/FormControls'

import {
  ROOM_IMAGE_ACCEPT,
  ROOM_IMAGE_MAX_COUNT,
} from '../schemas'
import { formatFileSize } from '../room-image-files'
import type {
  PendingRoomImage,
  PendingRoomImageStatus,
} from '../pending-room-images'

interface PendingRoomImagePickerProps {
  disabled?: boolean
  inputError?: string
  images: PendingRoomImage[]
  locked?: boolean
  onAddFiles: (files: FileList) => void
  onMoveImage: (clientId: string, direction: 'up' | 'down') => void
  onRemoveImage: (clientId: string) => void
  onRetryFailed?: () => void
  onRetryImage?: (clientId: string) => void
  onSetCover: (clientId: string) => void
}

interface PendingRoomImageStatusProps {
  status: PendingRoomImageStatus
}

function statusLabel(status: PendingRoomImageStatus) {
  switch (status) {
    case 'failed':
      return 'Tải lỗi'
    case 'uploaded':
      return 'Đã tải'
    case 'uploading':
      return 'Đang tải'
    default:
      return 'Chờ tải'
  }
}

function statusTone(status: PendingRoomImageStatus) {
  switch (status) {
    case 'failed':
      return 'rose' as const
    case 'uploaded':
      return 'emerald' as const
    case 'uploading':
      return 'blue' as const
    default:
      return 'slate' as const
  }
}

function PendingRoomImageStatus({ status }: PendingRoomImageStatusProps) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
}

export function PendingRoomImagePicker({
  disabled = false,
  inputError,
  images,
  locked = false,
  onAddFiles,
  onMoveImage,
  onRemoveImage,
  onRetryFailed,
  onRetryImage,
  onSetCover,
}: PendingRoomImagePickerProps) {
  const failedImages = useMemo(
    () => images.filter((image) => image.status === 'failed'),
    [images],
  )
  const statusSummary = useMemo(() => {
    const counts = images.reduce(
      (result, image) => {
        result[image.status] += 1
        return result
      },
      {
        failed: 0,
        pending: 0,
        uploaded: 0,
        uploading: 0,
      } as Record<PendingRoomImageStatus, number>,
    )

    if (images.length === 0) {
      return 'Chưa chọn ảnh. Bạn vẫn có thể tạo phòng không có ảnh.'
    }

    const parts = [`${images.length} ảnh đã chọn`]

    if (counts.uploaded > 0) parts.push(`${counts.uploaded} đã tải`)
    if (counts.uploading > 0) parts.push(`${counts.uploading} đang tải`)
    if (counts.pending > 0) parts.push(`${counts.pending} chờ tải`)
    if (counts.failed > 0) parts.push(`${counts.failed} tải lỗi`)

    return parts.join(' · ')
  }, [images])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      onAddFiles(event.target.files)
    }

    event.target.value = ''
  }

  return (
    <section
      aria-labelledby="pending-room-images-heading"
      className="grid gap-4 rounded-panel border border-line bg-surface-muted/55 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3
            className="text-base font-black text-ink"
            id="pending-room-images-heading"
          >
            Ảnh phòng
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            Chọn tối đa {ROOM_IMAGE_MAX_COUNT} ảnh JPEG, PNG hoặc WebP. Ảnh đầu
            tiên được chọn làm ảnh bìa nếu bạn chưa chọn ảnh khác.
          </p>
        </div>
        {failedImages.length > 0 && onRetryFailed ? (
          <Button
            disabled={disabled}
            onClick={onRetryFailed}
            variant="outline"
          >
            Thử tải lại {failedImages.length} ảnh lỗi
          </Button>
        ) : null}
      </div>

      <Field
        error={inputError}
        hint="Mỗi ảnh không vượt quá 8 MiB. Máy chủ vẫn kiểm tra nội dung thật của tệp."
        label="Chọn ảnh từ máy"
      >
        <Input
          accept={ROOM_IMAGE_ACCEPT}
          disabled={disabled || locked}
          multiple
          onChange={handleFileChange}
          type="file"
        />
      </Field>

      <p aria-live="polite" className="text-sm font-semibold text-muted">
        {statusSummary}
      </p>

      {images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image, index) => {
            const busy = disabled || image.status === 'uploading'

            return (
              <article
                aria-label={`Ảnh ${index + 1}: ${image.file.name}`}
                className="grid gap-3 rounded-card border border-line bg-surface p-3 shadow-elevation-1"
                key={image.clientId}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-surface-muted">
                  <img
                    alt={image.isCover ? `Ảnh bìa ${image.file.name}` : ''}
                    className="size-full object-cover"
                    src={image.previewUrl}
                  />
                  <div className="absolute left-2 top-2 flex flex-wrap gap-2">
                    <PendingRoomImageStatus status={image.status} />
                    {image.isCover ? <Badge tone="blue">Ảnh bìa</Badge> : null}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {image.file.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatFileSize(image.file.size)} · {image.file.type}
                  </p>
                </div>

                {image.errorMessage ? (
                  <p className="text-sm text-danger" role="alert">
                    {image.errorMessage}
                  </p>
                ) : null}

                <div
                  aria-live="polite"
                  className="flex flex-wrap gap-2"
                >
                  {!image.isCover ? (
                    <Button
                      aria-label={`Đặt ${image.file.name} làm ảnh bìa`}
                      className="flex-1"
                      disabled={busy || locked}
                      onClick={() => onSetCover(image.clientId)}
                      variant="outline"
                    >
                      Đặt làm bìa
                    </Button>
                  ) : null}
                  {image.status === 'failed' && onRetryImage ? (
                    <Button
                      aria-label={`Thử lại ${image.file.name}`}
                      className="flex-1"
                      disabled={disabled}
                      onClick={() => onRetryImage(image.clientId)}
                      variant="outline"
                    >
                      Thử lại
                    </Button>
                  ) : null}
                  <Button
                    aria-label={`Đưa ${image.file.name} lên`}
                    disabled={busy || locked || index === 0}
                    onClick={() => onMoveImage(image.clientId, 'up')}
                    variant="text"
                  >
                    Lên
                  </Button>
                  <Button
                    aria-label={`Đưa ${image.file.name} xuống`}
                    disabled={busy || locked || index === images.length - 1}
                    onClick={() => onMoveImage(image.clientId, 'down')}
                    variant="text"
                  >
                    Xuống
                  </Button>
                  <Button
                    aria-label={`Xóa ảnh ${image.file.name}`}
                    disabled={busy || locked}
                    onClick={() => onRemoveImage(image.clientId)}
                    variant="text"
                  >
                    Xóa
                  </Button>
                </div>

                <p className="text-xs font-semibold text-muted">
                  Thứ tự tải: {image.sortOrder}
                </p>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
