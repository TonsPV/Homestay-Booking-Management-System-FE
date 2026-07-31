import { useEffect, useState } from 'react'

import { getErrorMessage } from '@/api/errors'
import { useAmenityOptions } from '@/features/amenities/hooks'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import {
  Alert,
  EmptyState,
  LoadingState,
} from '@/shared/components/Feedback'

import { useSetRoomTypeAmenities } from '../hooks'
import type { AdminRoomType } from '../types'

interface RoomTypeAmenityEditorProps {
  onClose: () => void
  onSaved: () => void
  roomType: AdminRoomType | null
}

export function RoomTypeAmenityEditor({
  onClose,
  onSaved,
  roomType,
}: RoomTypeAmenityEditorProps) {
  const amenitiesQuery = useAmenityOptions(roomType !== null)
  const mutation = useSetRoomTypeAmenities()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setSelectedIds(roomType?.amenities.map((amenity) => amenity.id) ?? [])
  }, [roomType])

  async function save() {
    if (!roomType) {
      return
    }

    try {
      await mutation.mutateAsync({ amenityIds: selectedIds, id: roomType.id })
      onSaved()
      onClose()
    } catch {
      // Keep the dialog open so the API error remains visible.
    }
  }

  return (
    <ConfirmationDialog
      busy={mutation.isPending}
      confirmDisabled={amenitiesQuery.isPending || amenitiesQuery.isError}
      confirmLabel="Lưu tiện nghi"
      description="Danh sách mới sẽ thay thế toàn bộ tiện nghi đang gán cho loại phòng."
      onCancel={onClose}
      onConfirm={() => void save()}
      open={roomType !== null}
      title={roomType ? `Tiện nghi của ${roomType.name}` : 'Tiện nghi'}
      tone="primary"
    >
      {mutation.error ? (
        <Alert className="mb-4" tone="error">
          {getErrorMessage(mutation.error)}
        </Alert>
      ) : null}
      {amenitiesQuery.isPending ? (
        <LoadingState label="Đang tải tiện nghi..." />
      ) : amenitiesQuery.isError ? (
        <Alert tone="error">{getErrorMessage(amenitiesQuery.error)}</Alert>
      ) : amenitiesQuery.data.length === 0 ? (
        <EmptyState
          description="Hãy tạo tiện nghi trong mục quản lý Tiện nghi trước."
          title="Chưa có tiện nghi"
        />
      ) : (
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Chọn tiện nghi</legend>
          {amenitiesQuery.data.map((amenity) => (
            <label
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-line p-3 transition hover:border-brand/50 hover:bg-brand-soft"
              key={amenity.id}
            >
              <input
                checked={selectedIds.includes(amenity.id)}
                className="mt-0.5 size-4 shrink-0 accent-blue-600"
                onChange={(event) =>
                  setSelectedIds((current) =>
                    event.target.checked
                      ? [...current, amenity.id]
                      : current.filter((id) => id !== amenity.id),
                  )
                }
                type="checkbox"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">
                  {amenity.name}
                </span>
                {amenity.description ? (
                  <span className="mt-0.5 block text-xs leading-5 text-muted">
                    {amenity.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </ConfirmationDialog>
  )
}
