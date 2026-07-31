import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import {
  createAmenity,
  deleteAmenity,
  listAdminAmenities,
  listAmenities,
  restoreAmenity,
  updateAmenity,
} from './api'

function successResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      data,
      message: 'OK',
      path: '/api/v1/amenities',
      requestId: 'req-amenities',
      statusCode: 200,
      success: true,
      timestamp: '2026-07-27T12:00:00.000Z',
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 },
  )
}

afterEach(() => {
  configureAccessTokenProvider(() => null)
  vi.unstubAllGlobals()
})

describe('amenities API contract', () => {
  it('keeps public list unauthenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await listAmenities({ page: 2, search: 'wifi' })
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/amenities?page=2&search=wifi',
    )
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
  })

  it('uses authenticated admin routes for management and writes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(successResponse({ id: '5' }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await listAdminAmenities({ includeDeleted: true, page: 1 })
    await createAmenity({ description: null, name: 'Wi-Fi' })

    const [listUrl, listOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [createUrl, createOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]

    expect(listUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/amenities?includeDeleted=true&page=1',
    )
    expect(new Headers(listOptions.headers).get('Authorization')).toBe(
      'Bearer admin-token',
    )
    expect(createUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/amenities',
    )
    expect(createOptions.method).toBe('POST')
    expect(createOptions.body).toBe(
      JSON.stringify({ description: null, name: 'Wi-Fi' }),
    )
  })

  it('uses PATCH, DELETE and restore endpoints for the soft-delete lifecycle', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(successResponse({ id: '5' })),
      )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await updateAmenity('5', {
      description: 'Internet tốc độ cao',
      name: 'Wi-Fi 6',
    })
    await deleteAmenity('5')
    await restoreAmenity('5')

    const [updateUrl, updateOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [deleteUrl, deleteOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]
    const [restoreUrl, restoreOptions] = fetchMock.mock.calls[2] as [
      URL,
      RequestInit,
    ]

    expect(updateUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/amenities/5',
    )
    expect(updateOptions.method).toBe('PATCH')
    expect(deleteUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/amenities/5',
    )
    expect(deleteOptions.method).toBe('DELETE')
    expect(restoreUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/amenities/5/restore',
    )
    expect(restoreOptions.method).toBe('PATCH')
  })
})
