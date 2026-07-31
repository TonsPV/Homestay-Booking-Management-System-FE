import type { ApiFailure } from './types'

export type ApiErrorKind = 'aborted' | 'http' | 'network' | 'parse'

interface ApiErrorOptions {
  kind: ApiErrorKind
  status?: number
  code?: string
  retryAfterSeconds?: number
  requestId?: string
  payload?: unknown
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string
  readonly retryAfterSeconds?: number
  readonly requestId?: string
  readonly payload?: unknown

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = options.kind
    this.status = options.status
    this.code = options.code
    this.retryAfterSeconds = options.retryAfterSeconds
    this.requestId = options.requestId
    this.payload = options.payload
  }

  isStatus(status: number) {
    return this.status === status
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.requestId
      ? `${error.message} Mã tra cứu: ${error.requestId}.`
      : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export function messageFromFailure(
  payload: Partial<ApiFailure>,
  status?: number,
  retryAfterSeconds?: number,
) {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ')
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (status === 401) {
    return 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.'
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }

  if (status === 409) {
    return 'Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.'
  }

  if (status === 429) {
    return retryAfterSeconds === undefined
      ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
      : `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`
  }

  if (status && status >= 500) {
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  }

  return 'Yêu cầu không thể hoàn tất. Vui lòng thử lại.'
}
