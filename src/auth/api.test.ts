import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import {
  getMe,
  loginCustomer,
  loginUser,
  registerCustomer,
} from './api'
import type { Customer, LoginResponse, MeResponse, User } from './types'

const customer: Customer = {
  createdAt: '2026-07-26T00:00:00.000Z',
  email: 'guest@example.com',
  fullName: 'Guest',
  id: '1',
  phone: '0900000000',
  status: 'ACTIVE',
  updatedAt: '2026-07-26T00:00:00.000Z',
}

const staff: User = {
  createdAt: '2026-07-26T00:00:00.000Z',
  email: 'staff@example.com',
  fullName: 'Staff',
  id: '2',
  phone: null,
  role: 'STAFF',
  status: 'ACTIVE',
  updatedAt: '2026-07-26T00:00:00.000Z',
}

function successfulEnvelope(data: unknown) {
  return new Response(
    JSON.stringify({
      data,
      message: 'OK',
      path: '/api/v1/auth',
      requestId: 'req-auth',
      statusCode: 200,
      success: true,
      timestamp: '2026-07-26T00:00:00.000Z',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    },
  )
}

function requestFrom(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]

  return {
    body:
      init.body === undefined
        ? undefined
        : (JSON.parse(String(init.body)) as unknown),
    headers: new Headers(init.headers),
    method: init.method,
    url: String(url),
  }
}

afterEach(() => {
  configureAccessTokenProvider(() => null)
  vi.unstubAllGlobals()
})

describe('auth API contract', () => {
  it('registers a customer against the Backend customer registration route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope(customer))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      registerCustomer({
        email: customer.email,
        fullName: customer.fullName,
        password: 'password123',
        phone: customer.phone,
      }),
    ).resolves.toEqual(customer)

    expect(requestFrom(fetchMock)).toMatchObject({
      body: {
        email: customer.email,
        fullName: customer.fullName,
        password: 'password123',
        phone: customer.phone,
      },
      method: 'POST',
      url: 'http://localhost:3000/api/v1/auth/customers/register',
    })
  })

  it('uses separate customer and management login routes', async () => {
    const customerLogin: LoginResponse = {
      accessToken: 'customer-token',
      actorType: 'customer',
      customer,
      expiresIn: 3600,
      tokenType: 'Bearer',
    }
    const staffLogin: LoginResponse = {
      accessToken: 'staff-token',
      actorType: 'user',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: staff,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successfulEnvelope(customerLogin))
      .mockResolvedValueOnce(successfulEnvelope(staffLogin))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      loginCustomer({ identifier: customer.phone, password: 'password123' }),
    ).resolves.toEqual(customerLogin)
    expect(requestFrom(fetchMock)).toMatchObject({
      body: { identifier: customer.phone, password: 'password123' },
      method: 'POST',
      url: 'http://localhost:3000/api/v1/auth/customers/login',
    })

    await expect(
      loginUser({ identifier: staff.email, password: 'password123' }),
    ).resolves.toEqual(staffLogin)
    const [, secondInit] = fetchMock.mock.calls[1] as [URL, RequestInit]
    expect({
      body: JSON.parse(String(secondInit.body)) as unknown,
      method: secondInit.method,
      url: String(fetchMock.mock.calls[1]?.[0]),
    }).toMatchObject({
      body: { identifier: staff.email, password: 'password123' },
      method: 'POST',
      url: 'http://localhost:3000/api/v1/auth/users/login',
    })
  })

  it('restores the principal from /auth/me with the bearer token', async () => {
    const me: MeResponse = { actorType: 'user', user: staff }
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope(me))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    await expect(getMe()).resolves.toEqual(me)

    const request = requestFrom(fetchMock)
    expect(request.method).toBe('GET')
    expect(request.url).toBe('http://localhost:3000/api/v1/auth/me')
    expect(request.headers.get('Authorization')).toBe('Bearer staff-token')
  })

  it('rejects a mismatched actor returned by a login endpoint', async () => {
    const wrongActor: LoginResponse = {
      accessToken: 'staff-token',
      actorType: 'user',
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: staff,
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(successfulEnvelope(wrongActor)),
    )

    await expect(
      loginCustomer({ identifier: customer.phone, password: 'password123' }),
    ).rejects.toThrow()
  })

  it('rejects a matching actor without its required principal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        successfulEnvelope({
          accessToken: 'customer-token',
          actorType: 'customer',
          expiresIn: 3600,
          tokenType: 'Bearer',
        }),
      ),
    )

    await expect(
      loginCustomer({ identifier: customer.phone, password: 'password123' }),
    ).rejects.toThrow('dữ liệu đăng nhập không hợp lệ')
  })
})
