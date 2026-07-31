import { describe, expect, it } from 'vitest'

import { ApiError, getErrorMessage, messageFromFailure } from './errors'

describe('global API error messages', () => {
  it.each([
    [403, 'Bạn không có quyền thực hiện thao tác này.'],
    [
      409,
      'Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.',
    ],
    [429, 'Bạn thao tác quá nhanh. Vui lòng thử lại sau 30 giây.'],
    [500, 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'],
  ])('provides a recovery message for HTTP %i', (status, expected) => {
    expect(
      messageFromFailure({}, status, status === 429 ? 30 : undefined),
    ).toBe(expected)
  })

  it('keeps the Backend request ID in the support path', () => {
    expect(
      getErrorMessage(
        new ApiError('Không thể hoàn tất.', {
          kind: 'http',
          requestId: 'req-support-42',
          status: 409,
        }),
      ),
    ).toBe('Không thể hoàn tất. Mã tra cứu: req-support-42.')
  })
})
