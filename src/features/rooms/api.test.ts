import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import {
  blockRoomDates,
  createRoomImage,
  getRoom,
  listRoomCalendar,
  listRooms,
  listManagementRooms,
  searchRooms,
  unblockRoomDates,
  updateRoomStatus,
} from './api'

function successResponse(data: unknown, pagination?: object) {
  return new Response(
    JSON.stringify({
      success: true,
      statusCode: 200,
      message: 'OK',
      data,
      meta: pagination ? { pagination } : undefined,
      path: '/api/v1/rooms',
      requestId: 'req-rooms',
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

describe('rooms API contract', () => {
  it('lists public rooms without authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse([], {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await listRooms({
      page: 1,
      roomTypeId: '7',
      search: 'phòng biển',
    })

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/rooms?page=1&roomTypeId=7&search=ph%C3%B2ng+bi%E1%BB%83n',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
  })

  it('sends every availability search criterion to the public endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse([], {
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchRooms({
      amenityIds: ['3', '9'],
      checkIn: '2026-08-01',
      checkOut: '2026-08-03',
      guests: 3,
      maxPrice: '2500000.00',
      minPrice: '500000.00',
      page: 2,
      roomTypeId: '7',
    })
    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/rooms/search?amenityIds=3&amenityIds=9&checkIn=2026-08-01&checkOut=2026-08-03&guests=3&maxPrice=2500000.00&minPrice=500000.00&page=2&roomTypeId=7',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
    expect(result.pagination?.page).toBe(2)
  })

  it('gets a public room detail without authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({ id: '42', images: [] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await getRoom('42')

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/rooms/42',
    )
    expect(options.method).toBe('GET')
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
  })

  it('authenticates management filters and status updates', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(successResponse({ id: '5', status: 'CLEANING' }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    await listManagementRooms({
      page: 1,
      roomTypeId: '2',
      search: 'A101',
      status: 'READY',
    })
    await updateRoomStatus('5', 'CLEANING')

    const [listUrl, listOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [statusUrl, statusOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]

    expect(listUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/rooms?page=1&roomTypeId=2&search=A101&status=READY',
    )
    expect(
      new Headers(listOptions.headers).get('Authorization'),
    ).toBe('Bearer staff-token')
    expect(statusUrl.toString()).toBe(
      'http://localhost:3000/api/v1/rooms/5/status',
    )
    expect(statusOptions.method).toBe('PATCH')
    expect(statusOptions.body).toBe(JSON.stringify({ status: 'CLEANING' }))
  })

  it('uses the authenticated management room calendar contract', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(
        successResponse([
          {
            id: '91',
            stayDate: '2026-08-01',
            status: 'BLOCKED',
            reason: 'Bảo trì',
            booking: null,
          },
        ]),
      )
      .mockResolvedValueOnce(successResponse({ removedCount: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    const range = { from: '2026-08-01', to: '2026-08-03' }

    await listRoomCalendar('21', range)
    await blockRoomDates('21', { ...range, reason: 'Bảo trì' })
    await unblockRoomDates('21', range)

    const [calendarUrl, calendarOptions] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const [blockUrl, blockOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]
    const [unblockUrl, unblockOptions] = fetchMock.mock.calls[2] as [
      URL,
      RequestInit,
    ]

    expect(calendarUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/rooms/21/calendar?from=2026-08-01&to=2026-08-03',
    )
    expect(calendarOptions.method).toBe('GET')
    expect(
      new Headers(calendarOptions.headers).get('Authorization'),
    ).toBe('Bearer staff-token')
    expect(blockUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/rooms/21/blocks',
    )
    expect(blockOptions.method).toBe('POST')
    expect(blockOptions.body).toBe(
      JSON.stringify({ ...range, reason: 'Bảo trì' }),
    )
    expect(unblockUrl.toString()).toBe(
      'http://localhost:3000/api/v1/management/rooms/21/blocks?from=2026-08-01&to=2026-08-03',
    )
    expect(unblockOptions.method).toBe('DELETE')
  })

  it('uploads a room image as multipart data without overriding its boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({
        id: '9',
        imageUrl: '/media/room-images/5/image.webp',
        isCover: true,
        sortOrder: 3,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'admin-token')
    const file = new File(['room-image'], 'room.png', {
      type: 'image/png',
    })

    await createRoomImage('5', {
      file,
      isCover: true,
      sortOrder: 3,
    })

    const [url, options] = fetchMock.mock.calls[0] as [
      URL,
      RequestInit,
    ]
    const headers = new Headers(options.headers)
    const body = options.body as FormData

    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/rooms/5/images',
    )
    expect(options.method).toBe('POST')
    expect(headers.get('Authorization')).toBe('Bearer admin-token')
    expect(headers.has('Content-Type')).toBe(false)
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(body.get('isCover')).toBe('true')
    expect(body.get('sortOrder')).toBe('3')
  })

  it('omits optional room image fields when they are not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      successResponse({
        id: '10',
        imageUrl: '/media/room-images/5/image.webp',
        isCover: true,
        sortOrder: 0,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['room-image'], 'room.webp', {
      type: 'image/webp',
    })

    await createRoomImage('5', { file })

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const body = options.body as FormData

    expect(body.get('file')).toBe(file)
    expect(body.has('isCover')).toBe(false)
    expect(body.has('sortOrder')).toBe(false)
  })
})
