import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useRoomTypeOptions } from '@/features/room-types'
import { Alert } from '@/shared/components/Feedback'
import { PageHeader } from '@/shared/components/PageHeader'

import { PendingRoomImagePicker } from '../components/PendingRoomImagePicker'
import { RoomForm } from '../components/RoomForm'
import {
  useCreateRoomWithImages,
  useUploadRoomImages,
} from '../hooks'
import { usePendingRoomImages } from '../pending-room-images'
import type { PendingRoomImageStatusUpdate } from '../pending-room-images'
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from '../types'

/**
 * Standalone create-room flow (RESTful route /management/rooms/new).
 * Replaces the former inline editor on ManagementRoomsPage so the rooms list
 * stays scan-first. On success the user is navigated to the new room detail.
 */
export function CreateRoomPage() {
  const navigate = useNavigate()
  const [partialUploadMessage, setPartialUploadMessage] = useState<string>()
  const navigationTimeoutRef = useRef<number | undefined>(undefined)
  const mountedRef = useRef(true)
  const pendingImages = usePendingRoomImages()
  const updateImageStatus = pendingImages.updateImageStatus
  const roomTypesQuery = useRoomTypeOptions()
  const createWithImagesMutation = useCreateRoomWithImages()
  const uploadImagesMutation = useUploadRoomImages()
  const loading =
    createWithImagesMutation.isPending || uploadImagesMutation.isPending

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false

      if (navigationTimeoutRef.current !== undefined) {
        window.clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  const handleImageStatus = useCallback(
    (update: PendingRoomImageStatusUpdate) => {
      if (mountedRef.current) {
        updateImageStatus(update)
      }
    },
    [updateImageStatus],
  )

  function navigateToCreatedRoom(roomId: string, uploadedCount: number, total: number) {
    if (!mountedRef.current) {
      return
    }

    pendingImages.reset()

    // Brief pause so the success cache invalidation settles before the
    // detail page mounts and refetches room data.
    navigationTimeoutRef.current = window.setTimeout(() => {
      navigationTimeoutRef.current = undefined
      navigate(`/management/rooms/${roomId}`, {
        state: {
          createdRoom: {
            uploadedCount,
            totalImages: total,
          },
        },
      })
    }, 700)
  }

  async function handleSubmit(input: CreateRoomInput | UpdateRoomInput) {
    setPartialUploadMessage(undefined)

    if (createWithImagesMutation.isPending) {
      return
    }

    try {
      const result = await createWithImagesMutation.mutateAsync({
        images: pendingImages.images,
        input: input as CreateRoomInput,
        onImageStatus: handleImageStatus,
      })

      if (!mountedRef.current) {
        return
      }

      if (result.failedImages.length > 0) {
        setPartialUploadMessage(
          `Phòng đã được tạo, nhưng ${result.failedImages.length} trong ${pendingImages.images.length} ảnh chưa tải lên.`,
        )
        return
      }

      navigateToCreatedRoom(
        result.room.id,
        result.uploadedCount,
        pendingImages.images.length,
      )
    } catch {
      // Mutation state keeps the form open and renders the API error.
    }
  }

  async function retryImages(images: typeof pendingImages.images) {
    if (!images.length) {
      return
    }

    setPartialUploadMessage(undefined)

    try {
      const createdRoomId = createWithImagesMutation.data?.room.id

      if (!createdRoomId) {
        return
      }

      const result = await uploadImagesMutation.mutateAsync({
        images,
        onImageStatus: handleImageStatus,
        roomId: createdRoomId,
      })

      if (!mountedRef.current) {
        return
      }

      if (result.failedImages.length > 0) {
        setPartialUploadMessage(
          `Phòng đã được tạo, nhưng ${result.failedImages.length} trong ${pendingImages.images.length} ảnh chưa tải lên.`,
        )
        return
      }

      navigateToCreatedRoom(
        createdRoomId,
        pendingImages.images.length,
        pendingImages.images.length,
      )
    } catch {
      // Mutation state renders unexpected errors while keeping the retry state.
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Thông tin giá và sức chứa được lấy từ loại phòng."
        title="Tạo phòng mới"
      />

      {roomTypesQuery.isError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Không thể tải danh sách loại phòng:{' '}
              {getErrorMessage(roomTypesQuery.error)}
            </span>
            <button
              className="font-semibold underline underline-offset-4"
              onClick={() => void roomTypesQuery.refetch()}
              type="button"
            >
              Thử lại
            </button>
          </div>
        </Alert>
      ) : null}

      {createWithImagesMutation.error ? (
        <Alert tone="error">
          {getErrorMessage(createWithImagesMutation.error)}
        </Alert>
      ) : null}
      {uploadImagesMutation.error ? (
        <Alert tone="error">{getErrorMessage(uploadImagesMutation.error)}</Alert>
      ) : null}
      {partialUploadMessage ? (
        <Alert tone="warning">
          <div className="grid gap-3">
            <p>{partialUploadMessage}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="font-semibold underline underline-offset-4"
                onClick={() =>
                  void retryImages(
                    pendingImages.images.filter(
                      (image) => image.status === 'failed',
                    ),
                  )
                }
                type="button"
              >
                Thử tải lại ảnh
              </button>
            </div>
          </div>
        </Alert>
      ) : null}

      <RoomForm
        imagePicker={
          <PendingRoomImagePicker
            disabled={loading}
            images={pendingImages.images}
            inputError={pendingImages.inputError}
            locked={createWithImagesMutation.data !== undefined}
            onAddFiles={pendingImages.addFiles}
            onMoveImage={pendingImages.moveImage}
            onRemoveImage={pendingImages.removeImage}
            onRetryFailed={() =>
              void retryImages(
                pendingImages.images.filter(
                  (image) => image.status === 'failed',
                ),
              )
            }
            onRetryImage={(clientId) => {
              const image = pendingImages.images.find(
                (candidate) => candidate.clientId === clientId,
              )

              if (image) {
                void retryImages([image])
              }
            }}
            onSetCover={pendingImages.setCover}
          />
        }
        loading={loading}
        onCancel={() => navigate('/management/rooms')}
        onSubmit={handleSubmit}
        roomTypes={roomTypesQuery.data ?? []}
        roomFieldsDisabled={createWithImagesMutation.data !== undefined}
        submitDisabled={createWithImagesMutation.data !== undefined}
        submitLabel={
          createWithImagesMutation.data ? 'Đã tạo phòng' : undefined
        }
      />
    </div>
  )
}
