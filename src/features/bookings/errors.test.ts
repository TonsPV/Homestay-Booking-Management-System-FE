import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/errors'

import { getBookingActionError } from './errors'

function httpError(message: string, status: number) {
  return new ApiError(message, { kind: 'http', status })
}

describe('getBookingActionError', () => {
  it('translates known Backend booking errors into clear Vietnamese', () => {
    expect(
      getBookingActionError(
        httpError(
          'So luong khach vuot qua suc chua cua loai phong.',
          400,
        ),
      ),
    ).toBe('Số khách vượt quá sức chứa của phòng đã chọn.')
    expect(
      getBookingActionError(
        httpError(
          'Phong da duoc dat hoac bi khoa trong khoang ngay nay.',
          409,
        ),
      ),
    ).toBe('Phòng đã được đặt hoặc tạm khóa trong khoảng ngày này.')
  })

  it('uses a safe fallback for an unknown booking conflict', () => {
    expect(
      getBookingActionError(httpError('Unknown conflict.', 409)),
    ).toBe(
      'Dữ liệu đặt phòng vừa thay đổi. Vui lòng tải lại tình trạng phòng và thử lại.',
    )
  })
})
