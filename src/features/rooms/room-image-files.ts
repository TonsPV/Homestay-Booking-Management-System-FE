export const ROOM_IMAGE_MAX_FILE_SIZE = 8 * 1024 * 1024
export const ROOM_IMAGE_MAX_COUNT = 10

export const ROOM_IMAGE_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const ROOM_IMAGE_ACCEPT = ROOM_IMAGE_ACCEPTED_TYPES.join(',')

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0,
    }).format(size / 1024)} KiB`
  }

  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(size / (1024 * 1024))} MiB`
}
