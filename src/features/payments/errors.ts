import { ApiError, getErrorMessage } from '@/api/errors'

const PAYMENT_CONFLICT_MESSAGE =
  'Yêu cầu thanh toán chưa thể hoàn tất vì dữ liệu vừa thay đổi. Vui lòng tải lại lịch sử trước khi thử lại.'

export function getPaymentActionError(error: unknown) {
  if (error instanceof ApiError && error.isStatus(409)) {
    return PAYMENT_CONFLICT_MESSAGE
  }

  return getErrorMessage(error)
}

