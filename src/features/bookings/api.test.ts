import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import { bookingApi } from './api'

function successResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      message: 'OK',
      data,
      path: '/api/v1/bookings',
      requestId: 'req-bookings',
      timestamp: '2026-07-26T00:00:00.000Z',
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

describe('customer booking API contract', () => {
  it('posts the exact Backend customer booking payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '91', bookingCode: 'BK91' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    await bookingApi.createCustomer(
      {
        roomId: '12',
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-12',
        guestCount: 2,
        contactName: 'Nguyễn Văn B',
        contactPhone: '0901234567',
        contactEmail: null,
        customerNote: 'Phòng yên tĩnh',
      },
      'booking-customer-test-key',
    )

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/bookings',
    )
    expect(options.method).toBe('POST')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer customer-token',
    )
    expect(new Headers(options.headers).get('Idempotency-Key')).toBe(
      'booking-customer-test-key',
    )
    expect(JSON.parse(String(options.body))).toEqual({
      roomId: '12',
      checkInDate: '2026-09-10',
      checkOutDate: '2026-09-12',
      guestCount: 2,
      contactName: 'Nguyễn Văn B',
      contactPhone: '0901234567',
      contactEmail: null,
      customerNote: 'Phòng yên tĩnh',
    })
  })

  it('sends a request-intent key for management booking creation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '92', bookingCode: 'BK92' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await bookingApi.createManagement(
      {
        roomId: '12',
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-12',
        guestCount: 2,
        contactName: 'Nguyễn Văn B',
        contactPhone: '0901234567',
      },
      'booking-management-test-key',
    )

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/bookings',
    )
    expect(options.method).toBe('POST')
    expect(new Headers(options.headers).get('Idempotency-Key')).toBe(
      'booking-management-test-key',
    )
  })

  it('uses the supported customer list, detail, and cancel routes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(
        successResponse({ id: '91', bookingCode: 'BK91' }),
      )
      .mockResolvedValueOnce(
        successResponse({ id: '91', status: 'CANCELLED' }),
      )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    await bookingApi.listCustomer({ page: 2, status: 'CONFIRMED' })
    await bookingApi.getCustomer('91')
    await bookingApi.cancelCustomer('91', {
      reason: 'Thay đổi kế hoạch',
    })

    const [listUrl, listOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [detailUrl, detailOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]
    const [cancelUrl, cancelOptions] = fetchMock.mock.calls[2] as [
      URL,
      RequestInit,
    ]

    expect(listUrl.toString()).toBe(
      'http://localhost:3000/api/v1/bookings?page=2&status=CONFIRMED',
    )
    expect(listOptions.method).toBe('GET')
    expect(detailUrl.toString()).toBe(
      'http://localhost:3000/api/v1/bookings/91',
    )
    expect(detailOptions.method).toBe('GET')
    expect(cancelUrl.toString()).toBe(
      'http://localhost:3000/api/v1/bookings/91/cancel',
    )
    expect(cancelOptions.method).toBe('PATCH')
    expect(cancelOptions.body).toBe(
      JSON.stringify({ reason: 'Thay đổi kế hoạch' }),
    )
  })
})
