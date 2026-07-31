import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import {
  createRoomType,
  listAdminRoomTypes,
  listRoomTypes,
  setRoomTypeAmenities,
} from './api'

function successResponse(data: unknown, pagination?: object) {
  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      message: 'OK',
      data,
      meta: pagination ? { pagination } : undefined,
      path: '/api/v1/room-types',
      requestId: 'req-room-types',
      timestamp: '2026-07-24T12:00:00.000Z',
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

describe('room types API contract', () => {
  it('keeps public reads unauthenticated and paginated', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse([], {
        page: 3,
        limit: 20,
        total: 45,
        totalPages: 3,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await listRoomTypes({
      page: 3,
      search: 'gia đình',
    })
    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/room-types?page=3&search=gia+%C4%91%C3%ACnh',
    )
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
    expect(result.pagination?.totalPages).toBe(3)
  })

  it('uses the admin namespace for deleted records and writes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(successResponse({ id: '9' }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await listAdminRoomTypes({
      includeDeleted: true,
      page: 2,
      search: 'family',
    })
    await createRoomType({
      basePrice: '1250000.00',
      description: null,
      maxGuests: 4,
      name: 'Phòng gia đình',
    })

    const [listUrl, listOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [createUrl, createOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]

    expect(listUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/room-types?includeDeleted=true&page=2&search=family',
    )
    expect(
      new Headers(listOptions.headers).get('Authorization'),
    ).toBe('Bearer admin-token')
    expect(createUrl.toString()).toBe(
      'http://localhost:3000/api/v1/admin/room-types',
    )
    expect(createOptions.method).toBe('POST')
    expect(createOptions.body).toBe(
      JSON.stringify({
        basePrice: '1250000.00',
        description: null,
        maxGuests: 4,
        name: 'Phòng gia đình',
      }),
    )
  })

  it('replaces the RoomType amenity set with PUT', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse({ id: '9' }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')

    await setRoomTypeAmenities('9', { amenityIds: ['2', '5'] })

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/admin/room-types/9/amenities',
    )
    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify({ amenityIds: ['2', '5'] }))
  })
})
