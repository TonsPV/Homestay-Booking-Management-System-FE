import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureAccessTokenProvider } from '@/api/client'

import { chatApi } from './api'

function successResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      data,
      message: 'OK',
      path: '/api/v1/chat',
      requestId: 'req-chat',
      statusCode: 200,
      success: true,
      timestamp: '2026-09-13T00:00:00.000Z',
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

describe('chat API contract', () => {
  it('sends the client message id and content to the booking-scoped endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse({ id: '9' }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'customer-token')

    await chatApi.sendMessage('42', {
      clientMessageId: 'message-42',
      content: 'Tôi muốn hỏi về giờ nhận phòng.',
    })

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe(
      'http://localhost:3000/api/v1/chat/bookings/42/messages',
    )
    expect(options.method).toBe('POST')
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer customer-token',
    )
    expect(JSON.parse(String(options.body))).toEqual({
      clientMessageId: 'message-42',
      content: 'Tôi muốn hỏi về giờ nhận phòng.',
    })
  })

  it('keeps inbox filters and read markers on their booking-scoped API paths', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(successResponse([]))
      .mockResolvedValueOnce(successResponse({ lastReadSequence: 12 }))
    vi.stubGlobal('fetch', fetchMock)
    configureAccessTokenProvider(() => 'staff-token')

    await chatApi.listConversations({
      limit: 20,
      needsReply: true,
      page: 2,
      unread: true,
    })
    await chatApi.markRead('42', 12)

    const [listUrl] = fetchMock.mock.calls[0] as [URL, RequestInit]
    const [readUrl, readOptions] = fetchMock.mock.calls[1] as [
      URL,
      RequestInit,
    ]
    expect(listUrl.toString()).toBe(
      'http://localhost:3000/api/v1/chat/conversations?limit=20&needsReply=true&page=2&unread=true',
    )
    expect(readUrl.toString()).toBe(
      'http://localhost:3000/api/v1/chat/bookings/42/read',
    )
    expect(readOptions.method).toBe('PUT')
    expect(JSON.parse(String(readOptions.body))).toEqual({
      lastReadSequence: 12,
    })
  })
})
