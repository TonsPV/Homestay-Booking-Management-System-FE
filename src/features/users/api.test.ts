import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import { createUser, updateUser } from './api'
import type { CreateUserInput, UpdateUserInput } from './types'

function userResponse() {
  return new Response(
    JSON.stringify({
      data: {
        createdAt: '2026-07-29T00:00:00.000Z',
        email: 'staff@homestay-green.test',
        fullName: 'Nhân viên kiểm thử',
        id: '301',
        phone: '+84901234567',
        role: 'STAFF',
        status: 'ACTIVE',
        updatedAt: '2026-07-29T00:00:00.000Z',
      },
      message: 'OK',
      path: '/api/v1/users',
      requestId: 'req-users',
      statusCode: 200,
      success: true,
      timestamp: '2026-07-29T00:00:00.000Z',
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 },
  )
}

afterEach(() => {
  configureAccessTokenProvider(() => null)
  vi.unstubAllGlobals()
})

describe('user management API contract', () => {
  it('creates only a STAFF account and never forwards a role field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(userResponse())
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    const input = {
      email: 'staff@homestay-green.test',
      fullName: 'Nhân viên kiểm thử',
      password: 'StaffPassword123!',
      phone: '+84901234567',
      role: 'ADMIN',
    } as CreateUserInput & { role: 'ADMIN' }

    await createUser(input)

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe('http://localhost:3000/api/v1/users')
    expect(options.method).toBe('POST')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer admin-token',
    )
    expect(JSON.parse(String(options.body))).toEqual({
      email: 'staff@homestay-green.test',
      fullName: 'Nhân viên kiểm thử',
      password: 'StaffPassword123!',
      phone: '+84901234567',
    })
  })

  it('updates profile fields without forwarding a role field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(userResponse())
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    const input = {
      fullName: 'Nhân viên đã cập nhật',
      role: 'ADMIN',
    } as UpdateUserInput & { role: 'ADMIN' }

    await updateUser({ id: '301', input })

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/users/301',
    )
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(String(options.body))).toEqual({
      fullName: 'Nhân viên đã cập nhật',
    })
  })
})
