import { ApiError, getErrorMessage } from '@/api/errors'

import { createRoom, createRoomImage } from './api'
import {
  ROOM_IMAGE_MAX_COUNT,
  roomImageFormSchema,
} from './schemas'
import type {
  CreateRoomImageInput,
  CreateRoomInput,
  Room,
  RoomImage,
} from './types'
import type {
  PendingRoomImage,
  PendingRoomImageStatusUpdate,
} from './pending-room-images'

export interface RoomImageUploadDependencies {
  uploadImage: (
    roomId: string,
    input: CreateRoomImageInput,
  ) => Promise<RoomImage>
}

export interface RoomImageUploadResult {
  failedImages: PendingRoomImage[]
  stopped: boolean
  uploadedCount: number
}

export interface CreateRoomWithImagesDependencies
  extends RoomImageUploadDependencies {
  createRoom: (input: CreateRoomInput) => Promise<Room>
}

export interface CreateRoomWithImagesResult extends RoomImageUploadResult {
  room: Room
}

export type RoomImageStatusHandler = (
  update: PendingRoomImageStatusUpdate,
) => void

function shouldStopImageUpload(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  )
}

function uploadOrder(images: PendingRoomImage[]) {
  return [...images].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1
    }

    return left.sortOrder - right.sortOrder
  })
}

function safeStoppedMessage(error: unknown) {
  return `${getErrorMessage(error)} Các ảnh còn lại chưa được tải lên.`
}

function validatePendingImages(
  images: PendingRoomImage[],
  requireCover = false,
) {
  if (images.length > ROOM_IMAGE_MAX_COUNT) {
    return `Chỉ được chọn tối đa ${ROOM_IMAGE_MAX_COUNT} ảnh.`
  }

  if (requireCover && images.length > 0 && images.filter((image) => image.isCover).length !== 1) {
    return 'Phải có đúng một ảnh bìa.'
  }

  for (const image of images) {
    const result = roomImageFormSchema.safeParse({
      file: image.file,
      isCover: image.isCover,
      sortOrder: String(image.sortOrder),
    })

    if (!result.success) {
      return result.error.issues[0]?.message ?? 'Ảnh chưa hợp lệ.'
    }
  }

  return undefined
}

export async function uploadRoomImages(
  roomId: string,
  images: PendingRoomImage[],
  dependencies: RoomImageUploadDependencies = { uploadImage: createRoomImage },
  onStatus?: RoomImageStatusHandler,
): Promise<RoomImageUploadResult> {
  const validationError = validatePendingImages(images)

  if (validationError) {
    throw new Error(validationError)
  }

  const failedImages: PendingRoomImage[] = []
  let uploadedCount = 0
  let stopped = false
  const orderedImages = uploadOrder(images)

  for (const [index, image] of orderedImages.entries()) {
    onStatus?.({ clientId: image.clientId, status: 'uploading' })

    try {
      const uploadedImage = await dependencies.uploadImage(roomId, {
        file: image.file,
        isCover: image.requestedCover ?? image.isCover,
        sortOrder: image.sortOrder,
      })

      uploadedCount += 1
      onStatus?.({
        clientId: image.clientId,
        isCover: uploadedImage.isCover,
        status: 'uploaded',
        uploadedImageId: uploadedImage.id,
      })
    } catch (error) {
      const errorMessage = shouldStopImageUpload(error)
        ? safeStoppedMessage(error)
        : getErrorMessage(error)

      failedImages.push(image)
      onStatus?.({
        clientId: image.clientId,
        errorMessage,
        status: 'failed',
      })

      if (shouldStopImageUpload(error)) {
        stopped = true

        for (const remainingImage of orderedImages.slice(index + 1)) {
          failedImages.push(remainingImage)
          onStatus?.({
            clientId: remainingImage.clientId,
            errorMessage,
            status: 'failed',
          })
        }

        break
      }
    }
  }

  return { failedImages, stopped, uploadedCount }
}

export async function createRoomWithImages(
  input: CreateRoomInput,
  images: PendingRoomImage[],
  dependencies: CreateRoomWithImagesDependencies = {
    createRoom,
    uploadImage: createRoomImage,
  },
  onStatus?: RoomImageStatusHandler,
): Promise<CreateRoomWithImagesResult> {
  const validationError = validatePendingImages(images, true)

  if (validationError) {
    throw new Error(validationError)
  }

  const room = await dependencies.createRoom(input)
  const uploadResult = await uploadRoomImages(
    room.id,
    images,
    dependencies,
    onStatus,
  )

  return { room, ...uploadResult }
}
