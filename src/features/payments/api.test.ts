import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import { paymentApi } from './api'

function successResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      message: 'OK',
      data,
      path: '/api/v1/payments',
      requestId: 'req-payments',
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

describe('payment API contract', () => {
  it('loads a management payment by its identifier instead of guessing from the first page', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '91', status: 'SUCCESS' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    await paymentApi.getManagement('91')

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/payments/91',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer staff-token',
    )
  })

  it('creates VNPay with the Backend payload and idempotency header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({
        payment: { bookingId: '12', id: '31', status: 'PENDING' },
        paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    await paymentApi.createVnPay('12', 'vnpay-attempt-1234', {
      bankCode: 'VNBANK',
      locale: 'vn',
    })

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const headers = new Headers(options.headers)

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/bookings/12/payments',
    )
    expect(options.method).toBe('POST')
    expect(headers.get('Authorization')).toBe('Bearer customer-token')
    expect(headers.get('Idempotency-Key')).toBe('vnpay-attempt-1234')
    expect(options.body).toBe(
      JSON.stringify({ bankCode: 'VNBANK', locale: 'vn' }),
    )
  })

  it('creates a manual payment without sending an amount', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({
        bookingId: '12',
        id: '32',
        method: 'BANK_TRANSFER',
        status: 'SUCCESS',
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    await paymentApi.createManual('12', 'manual-attempt-1234', {
      method: 'BANK_TRANSFER',
    })

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const headers = new Headers(options.headers)

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/bookings/12/payments',
    )
    expect(options.method).toBe('POST')
    expect(headers.get('Idempotency-Key')).toBe('manual-attempt-1234')
    expect(JSON.parse(String(options.body))).toEqual({
      method: 'BANK_TRANSFER',
    })
    expect(JSON.parse(String(options.body))).not.toHaveProperty('amount')
  })

  it('sends an idempotency key when refunding and exposes reconciliation', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          successResponse({ id: '32', status: 'REFUNDED' }),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await paymentApi.refund('32', 'refund-attempt-1234', {
      reason: 'Customer request',
    })
    await paymentApi.reconcileRefund('32')

    const [refundUrl, refundOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [reconcileUrl, reconcileOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]

    expect(refundUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/payments/32/refund',
    )
    expect(
      new Headers(refundOptions.headers).get('Idempotency-Key'),
    ).toBe('refund-attempt-1234')
    expect(JSON.parse(String(refundOptions.body))).toEqual({
      reason: 'Customer request',
    })
    expect(reconcileUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/payments/32/reconcile-refund',
    )
    expect(reconcileOptions.method).toBe('POST')
  })

  it('resolves a duplicate charge on the dedicated endpoint with the idempotency key and no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '95', status: 'REFUND_PENDING' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await paymentApi.resolveDuplicateCharge('95', 'duplicate-key-1234')

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const headers = new Headers(options.headers)

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/payments/95/resolve-duplicate-charge',
    )
    expect(options.method).toBe('POST')
    expect(headers.get('Idempotency-Key')).toBe('duplicate-key-1234')
    expect(headers.get('Authorization')).toBe('Bearer admin-token')
    expect(options.body).toBeUndefined()
  })

  it('never sends the duplicate review to the generic refund endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '95', status: 'REFUNDED' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await paymentApi.resolveDuplicateCharge('95', 'duplicate-key-1234')

    for (const [url] of fetchMock.mock.calls as Array<[URL, RequestInit]>) {
      expect(url.pathname).not.toContain('/refund')
    }
  })

  it('forwards every VNPay return parameter to the public verifier', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({
        paymentId: '31',
        paymentStatus: 'PENDING',
        validSignature: true,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    await paymentApi.verifyVnPayReturn(
      '?vnp_TxnRef=P31&vnp_ResponseCode=00&vnp_Test=a&vnp_Test=b',
    )

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/payments/vnpay/return?vnp_TxnRef=P31&vnp_ResponseCode=00&vnp_Test=a&vnp_Test=b',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
  })
})
