import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ROOM_IMAGE_MAX_COUNT,
  roomImageFormSchema,
} from './schemas'

export type PendingRoomImageStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'failed'

export interface PendingRoomImage {
  clientId: string
  file: File
  previewUrl: string
  isCover: boolean
  requestedCover?: boolean
  sortOrder: number
  status: PendingRoomImageStatus
  errorMessage?: string
  uploadedImageId?: string
}

export type PendingRoomImageStatusUpdate = {
  clientId: string
  isCover?: boolean
  status: PendingRoomImageStatus
  errorMessage?: string
  uploadedImageId?: string
}

export interface PendingRoomImagesState {
  images: PendingRoomImage[]
  inputError?: string
  addFiles: (files: FileList | readonly File[]) => void
  removeImage: (clientId: string) => void
  reset: () => void
  setCover: (clientId: string) => void
  moveImage: (clientId: string, direction: 'up' | 'down') => void
  updateImageStatus: (update: PendingRoomImageStatusUpdate) => void
}

function createClientId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `room-image-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeImages(images: PendingRoomImage[]) {
  const coverIndex = images.findIndex((image) => image.isCover)
  const selectedCoverIndex = coverIndex >= 0 ? coverIndex : images.length > 0 ? 0 : -1
  const hasRequestedCover = images.some(
    (image) => image.requestedCover === true,
  )

  return images.map((image, index) => ({
    ...image,
    isCover: index === selectedCoverIndex,
    requestedCover: hasRequestedCover
      ? image.requestedCover === true
      : index === selectedCoverIndex,
    sortOrder: index,
  }))
}

function firstFileError(file: File) {
  const result = roomImageFormSchema.safeParse({
    file,
    isCover: false,
    sortOrder: '0',
  })

  if (result.success) {
    return undefined
  }

  return result.error.issues.find((issue) => issue.path[0] === 'file')?.message
}

export function usePendingRoomImages(): PendingRoomImagesState {
  const [images, setImages] = useState<PendingRoomImage[]>([])
  const [inputError, setInputError] = useState<string>()
  const activePreviewUrls = useRef(new Set<string>())

  const revokePreviewUrl = useCallback((previewUrl: string) => {
    if (!activePreviewUrls.current.has(previewUrl)) {
      return
    }

    URL.revokeObjectURL(previewUrl)
    activePreviewUrls.current.delete(previewUrl)
  }, [])

  const addFiles = useCallback(
    (files: FileList | readonly File[]) => {
      const selectedFiles = Array.from(files)

      if (selectedFiles.length === 0) {
        return
      }

      const nextImages: PendingRoomImage[] = []
      const errors: string[] = []
      const availableSlots = Math.max(ROOM_IMAGE_MAX_COUNT - images.length, 0)

      let acceptedCount = 0

      selectedFiles.forEach((file) => {
        if (acceptedCount >= availableSlots) {
          errors.push(
            `Chỉ được chọn tối đa ${ROOM_IMAGE_MAX_COUNT} ảnh trong một lần tạo.`,
          )
          return
        }

        const error = firstFileError(file)

        if (error) {
          errors.push(`${file.name}: ${error}`)
          return
        }

        acceptedCount += 1
        const previewUrl = URL.createObjectURL(file)
        activePreviewUrls.current.add(previewUrl)
        nextImages.push({
          clientId: createClientId(),
          file,
          isCover: images.length === 0 && nextImages.length === 0,
          previewUrl,
          requestedCover: images.length === 0 && nextImages.length === 0,
          sortOrder: images.length + nextImages.length,
          status: 'pending',
        })
      })

      if (nextImages.length > 0) {
        setImages((current) => normalizeImages([...current, ...nextImages]))
      }

      setInputError(errors.length > 0 ? errors.join(' ') : undefined)
    },
    [images.length],
  )

  const removeImage = useCallback(
    (clientId: string) => {
      const image = images.find((candidate) => candidate.clientId === clientId)

      if (!image) {
        return
      }

      revokePreviewUrl(image.previewUrl)
      setImages((current) =>
        normalizeImages(
          current.filter((candidate) => candidate.clientId !== clientId),
        ),
      )
    },
    [images, revokePreviewUrl],
  )

  const reset = useCallback(() => {
    for (const previewUrl of activePreviewUrls.current) {
      URL.revokeObjectURL(previewUrl)
    }

    activePreviewUrls.current.clear()
    setImages([])
    setInputError(undefined)
  }, [])

  const setCover = useCallback((clientId: string) => {
    setImages((current) =>
      normalizeImages(
        current.map((image) => ({
          ...image,
          isCover: image.clientId === clientId,
          requestedCover: image.clientId === clientId,
        })),
      ),
    )
  }, [])

  const moveImage = useCallback(
    (clientId: string, direction: 'up' | 'down') => {
      setImages((current) => {
        const index = current.findIndex((image) => image.clientId === clientId)

        if (index < 0) {
          return current
        }

        const nextIndex = direction === 'up' ? index - 1 : index + 1

        if (nextIndex < 0 || nextIndex >= current.length) {
          return current
        }

        const next = [...current]
        const [image] = next.splice(index, 1)
        next.splice(nextIndex, 0, image)
        return normalizeImages(next)
      })
    },
    [],
  )

  const updateImageStatus = useCallback(
    ({
      clientId,
      errorMessage,
      isCover,
      status,
      uploadedImageId,
    }: PendingRoomImageStatusUpdate) => {
      setImages((current) =>
        current.map((image) => {
          const isUpdatedImage = image.clientId === clientId

          return {
            ...image,
            isCover:
              isCover === true
                ? isUpdatedImage
                : isCover === false && isUpdatedImage
                  ? false
                  : image.isCover,
            ...(isUpdatedImage
              ? {
                  errorMessage,
                  status,
                  uploadedImageId,
                }
              : {}),
          }
        }),
      )
    },
    [],
  )

  useEffect(() => {
    const previewUrls = activePreviewUrls.current

    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  return {
    addFiles,
    images,
    inputError,
    moveImage,
    removeImage,
    reset,
    setCover,
    updateImageStatus,
  }
}

export function normalizePendingRoomImages(images: PendingRoomImage[]) {
  return normalizeImages(images)
}
