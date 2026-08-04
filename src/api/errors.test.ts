import { describe, expect, it } from 'vitest'

import {
  ApiError,
  getApiFieldErrorCode,
  getErrorMessage,
  messageFromFailure,
} from './errors'

describe('global API error messages', () => {
  it('prefers stable Backend error codes over status-only fallbacks', () => {
    expect(
      messageFromFailure(
        { errorCode: 'COMMON_FORBIDDEN' },
        400,
      ),
    ).toBe('Bạn không có quyền thực hiện thao tác này.')
    expect(
      messageFromFailure({ errorCode: 'COMMON_PAYLOAD_TOO_LARGE' }, 413),
    ).toBe('Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.')
  })

  it.each([
    [403, 'Bạn không có quyền thực hiện thao tác này.'],
    [
      409,
      'Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.',
    ],
    [429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau 30 giây.'],
    [500, 'Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.'],
  ])('provides a recovery message for HTTP %i', (status, expected) => {
    expect(
      messageFromFailure({}, status, status === 429 ? 30 : undefined),
    ).toBe(expected)
  })

  it('keeps technical identifiers out of the customer message', () => {
    expect(
      getErrorMessage(
        new ApiError('Thông báo nội bộ.', {
          kind: 'http',
          requestId: 'req-support-42',
          serverMessage: 'ROOM_CALENDAR_CONFLICT 42',
          status: 409,
        }),
      ),
    ).toBe(
      'Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.',
    )
  })

  it('does not expose an unknown Error message', () => {
    expect(getErrorMessage(new Error('Unexpected token < in JSON'))).toBe(
      'Không thể hoàn tất thao tác. Vui lòng thử lại.',
    )
  })

  it('does not expose parse diagnostics', () => {
    expect(
      getErrorMessage(
        new ApiError('Unexpected token < in JSON', { kind: 'parse' }),
      ),
    ).toBe('Không thể đọc dữ liệu từ hệ thống. Vui lòng thử lại.')
  })

  it('exposes only the stable field code for form integration', () => {
    const error = new ApiError('Raw Backend field message', {
      errorCode: 'CUSTOMER_EMAIL_IN_USE',
      fieldErrors: {
        email: [
          {
            errorCode: 'CUSTOMER_EMAIL_IN_USE',
            message: 'Email da duoc su dung.',
          },
        ],
      },
      kind: 'http',
      status: 409,
    })

    expect(getApiFieldErrorCode(error, 'email')).toBe(
      'CUSTOMER_EMAIL_IN_USE',
    )
    expect(getApiFieldErrorCode(error, 'phone')).toBeUndefined()
  })
})
