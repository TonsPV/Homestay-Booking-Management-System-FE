import { afterEach, describe, expect, it, vi } from 'vitest'

import { bookingApi } from '@/features/bookings/api'
import { paymentApi } from '@/features/payments/api'

afterEach(() => {
  vi.unstubAllGlobals()
})

function successfulEnvelope(data: unknown) {
  return new Response(
    JSON.stringify({
      data,
      message: 'OK',
      path: '/api/v1/test',
      requestId: 'req-paths',
      statusCode: 200,
      success: true,
      timestamp: '2026-07-24T00:00:00.000Z',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

describe('versioned feature API paths', () => {
  it('does not duplicate the /api/v1 prefix for bookings', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope([]))
    vi.stubGlobal('fetch', fetchMock)

    await bookingApi.listCustomer({ page: 1 })

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'http://localhost:3000/api/v1/bookings?page=1',
    )
  })

  it('does not duplicate the /api/v1 prefix for payments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope([]))
    vi.stubGlobal('fetch', fetchMock)

    await paymentApi.listCustomer('booking-1', { page: 1 })

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'http://localhost:3000/api/v1/bookings/booking-1/payments?page=1',
    )
  })
})
