import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from './errors'
import {
  apiRequest,
  buildApiUrl,
  configureAccessTokenProvider,
  configureUnauthorizedHandler,
} from './client'

afterEach(() => {
  configureAccessTokenProvider(() => null)
  configureUnauthorizedHandler(null)
  vi.unstubAllGlobals()
})

describe('buildApiUrl', () => {
  it('uses the browser origin in dev and omits empty query values', () => {
    const url = buildApiUrl('/rooms/search', {
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      guests: 2,
      roomTypeId: undefined,
    })

    expect(url.toString()).toBe(
      `${window.location.origin}/api/v1/rooms/search?checkIn=2026-08-01&checkOut=2026-08-03&guests=2`,
    )
  })
})

describe('apiRequest', () => {
  it('attaches the bearer token and unwraps data with pagination', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          statusCode: 200,
          message: 'OK',
          data: [{ id: '1' }],
          meta: {
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1,
            },
          },
          path: '/api/v1/rooms',
          requestId: 'req-success',
          timestamp: '2026-07-23T13:45:00.000Z',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'access-token')

    const result = await apiRequest<Array<{ id: string }>>('/rooms')
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit

    expect(result.data).toEqual([{ id: '1' }])
    expect(result.meta?.pagination?.total).toBe(1)
    expect(result.requestId).toBe('req-success')
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer access-token',
    )
  })

  it('normalizes an HTTP error and exposes Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            statusCode: 429,
            errorCode: 'COMMON_RATE_LIMITED',
            fieldErrors: {
              identifier: [{ errorCode: 'COMMON_RATE_LIMITED' }],
            },
            details: { retryable: true },
            message: 'Too many requests.',
            error: 'Too Many Requests',
            path: '/api/v1/auth/customers/login',
            requestId: 'req-rate-limit',
            timestamp: '2026-07-23T13:45:00.000Z',
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '45',
            },
            status: 429,
          },
        ),
      ),
    )

    await expect(
      apiRequest('/auth/customers/login', {
        auth: false,
        body: { identifier: 'example@example.com', password: 'password' },
        method: 'POST',
      }),
    ).rejects.toMatchObject({
      kind: 'http',
      errorCode: 'COMMON_RATE_LIMITED',
      fieldErrors: {
        identifier: [{ errorCode: 'COMMON_RATE_LIMITED' }],
      },
      details: { retryable: true },
      message:
        'Bạn thao tác quá nhanh. Vui lòng thử lại sau 45 giây.',
      requestId: 'req-rate-limit',
      retryAfterSeconds: 45,
      serverMessage: 'Too many requests.',
      status: 429,
    } satisfies Partial<ApiError>)
  })

  it('handles a non-JSON 401 as HTTP and clears only the current session', async () => {
    const unauthorizedHandler = vi.fn()

    configureAccessTokenProvider(() => 'current-token')
    configureUnauthorizedHandler(unauthorizedHandler)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>Unauthorized</html>', {
          headers: { 'Content-Type': 'text/html' },
          status: 401,
        }),
      ),
    )

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      kind: 'http',
      status: 401,
    } satisfies Partial<ApiError>)
    await Promise.resolve()

    expect(unauthorizedHandler).toHaveBeenCalledOnce()
  })

  it('does not let a stale 401 clear a newer session', async () => {
    let currentToken = 'old-token'
    let resolveResponse: ((response: Response) => void) | undefined
    const unauthorizedHandler = vi.fn()

    configureAccessTokenProvider(() => currentToken)
    configureUnauthorizedHandler(unauthorizedHandler)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve
          }),
      ),
    )

    const pendingRequest = apiRequest('/auth/me')
    currentToken = 'new-token'
    resolveResponse?.(
      new Response(null, {
        status: 401,
      }),
    )

    await expect(pendingRequest).rejects.toMatchObject({
      kind: 'http',
      status: 401,
    } satisfies Partial<ApiError>)
    await Promise.resolve()

    expect(unauthorizedHandler).not.toHaveBeenCalled()
  })

  it('rejects malformed successful responses as parse errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('not-json', {
          status: 200,
        }),
      ),
    )

    await expect(apiRequest('/rooms', { auth: false })).rejects.toMatchObject({
      kind: 'parse',
      status: 200,
    } satisfies Partial<ApiError>)
  })

  it('normalizes an offline failure as a retryable network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    await expect(
      apiRequest('/rooms', { auth: false }),
    ).rejects.toMatchObject({
      kind: 'network',
    } satisfies Partial<ApiError>)
  })
})
