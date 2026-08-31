import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/errors'

import { getRoomTypeActionError } from './errors'

describe('getRoomTypeActionError', () => {
  it('explains how to resolve an in-use room type conflict', () => {
    const message = getRoomTypeActionError(
      new ApiError('Backend message', {
        errorCode: 'ROOM_TYPE_IN_USE',
        kind: 'http',
        status: 409,
      }),
    )

    expect(message).toContain('vẫn còn phòng đang sử dụng')
    expect(message).toContain('chuyển các phòng liên quan')
  })
})
