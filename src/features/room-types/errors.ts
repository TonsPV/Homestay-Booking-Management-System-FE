import { ApiError, getErrorMessage } from '@/api/errors'

export function getRoomTypeActionError(error: unknown) {
  if (error instanceof ApiError && error.errorCode === 'ROOM_TYPE_IN_USE') {
    return 'Không thể xóa loại phòng vì vẫn còn phòng đang sử dụng. Hãy chuyển các phòng liên quan sang loại khác rồi thử lại.'
  }

  return getErrorMessage(error)
}
