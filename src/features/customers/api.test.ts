import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import {
  changeCustomerPassword,
  setInitialCustomerPassword,
} from './api'

afterEach(() => {
  configureAccessTokenProvider(() => null)
  vi.unstubAllGlobals()
})

describe('customer credential API contract', () => {
  it('sends the current and new password to the authenticated endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          statusCode: 200,
          message: 'OK',
          data: { passwordConfigured: true },
          path: '/api/v1/customers/me/password',
          requestId: 'req-customer-password',
          timestamp: '2026-07-27T05:00:00.000Z',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    const result = await changeCustomerPassword({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword456!',
    })
    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/customers/me/password',
    )
    expect(options.method).toBe('PATCH')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer customer-token',
    )
    expect(options.body).toBe(
      JSON.stringify({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
      }),
    )
    expect(result.passwordConfigured).toBe(true)
  })

  it('sets an initial password through the management credential endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          statusCode: 200,
          message: 'OK',
          data: { passwordConfigured: true },
          path: '/api/v1/management/customers/42/initial-password',
          requestId: 'req-initial-password',
          timestamp: '2026-07-29T12:00:00.000Z',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await expect(
      setInitialCustomerPassword({
        id: '42',
        password: 'InitialPassword123!',
      }),
    ).resolves.toEqual({ passwordConfigured: true })

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/management/customers/42/initial-password',
    )
    expect(options.method).toBe('PATCH')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer admin-token',
    )
    expect(options.body).toBe(
      JSON.stringify({ password: 'InitialPassword123!' }),
    )
  })
})
