import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import { dashboardApi } from './api'

function successResponse() {
  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      message: 'OK',
      data: {
        fromDate: '2026-07-01',
        toDate: '2026-07-29',
        bookings: {
          pendingPayment: 1,
          confirmed: 2,
          checkedIn: 3,
          checkedOut: 4,
          cancelled: 5,
        },
        rooms: {
          ready: 6,
          occupied: 3,
          cleaning: 1,
          maintenance: 0,
        },
        revenue: {
          vnpay: 1_000_000,
          manual: 500_000,
          total: 1_500_000,
        },
        totalRefunded: 100_000,
        payments: {
          requiresReview: 1,
          refundPending: 2,
        },
        occupancy: {
          roomNightsReserved: 12,
          roomNightsAvailable: 20,
          occupancyRate: 60,
        },
        generatedAt: '2026-07-29T04:00:00.000Z',
      },
      path: '/api/v1/management/dashboard/summary',
      requestId: 'req-dashboard',
      timestamp: '2026-07-29T04:00:00.000Z',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

afterEach(() => {
  configureAccessTokenProvider(() => null)
  vi.unstubAllGlobals()
})

describe('dashboard API contract', () => {
  it('gets the management summary with the exact date range and bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse())
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'management-token')

    const result = await dashboardApi.getSummary({
      from: '2026-07-01',
      to: '2026-07-29',
    })

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/dashboard/summary?from=2026-07-01&to=2026-07-29',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer management-token',
    )
    expect(result.revenue.total).toBe(1_500_000)
  })
})
