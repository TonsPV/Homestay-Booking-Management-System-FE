import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { chatKeys } from './query-keys'
import { synchronizeBookingMessages } from './message-sync'
import type { ChatMessageList } from './types'
import { ChatRealtimeBridge } from './ChatRealtimeBridge'

const ioMock = vi.hoisted(() => vi.fn())
const listMessagesMock = vi.hoisted(() => vi.fn())
const readAuthSessionMock = vi.hoisted(() => vi.fn())
const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('socket.io-client', () => ({ io: ioMock }))

vi.mock('./api', () => ({
  chatApi: { listMessages: listMessagesMock },
}))

vi.mock('@/app/config', () => ({
  appConfig: {
    apiOrigin: 'https://api.example.test',
    apiPrefix: '/api/v1',
    chatEnabled: true,
  },
}))

vi.mock('@/auth/session-storage', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/auth/useAuth', () => ({
  useAuth: useAuthMock,
}))

describe('ChatRealtimeBridge', () => {
  beforeEach(() => {
    ioMock.mockReset()
    listMessagesMock.mockReset()
    readAuthSessionMock.mockReset()
    useAuthMock.mockReset()
  })

  it('connects to the booking chat namespace with the JWT handshake token', () => {
    const socket = {
      disconnect: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
    }
    ioMock.mockReturnValue(socket)
    readAuthSessionMock.mockReturnValue({
      accessToken: 'customer-token',
      expiresAt: Date.now() + 60_000,
    })
    useAuthMock.mockReturnValue({
      principal: { actorType: 'customer', id: '42' },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const view = render(
      <QueryClientProvider client={queryClient}>
        <ChatRealtimeBridge />
      </QueryClientProvider>,
    )

    expect(ioMock).toHaveBeenCalledWith(`${window.location.origin}/chat`, {
      auth: { token: 'customer-token' },
      path: '/socket.io',
      transports: ['websocket'],
    })

    view.unmount()
    expect(socket.disconnect).toHaveBeenCalledOnce()
  })

  it('loads a missing sequence from the last contiguous cursor rather than a later cached POST result', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const bookingId = 'booking-1'
    const queryKey = chatKeys.messages(bookingId, { limit: 50 })
    queryClient.setQueryData<ChatMessageList>(queryKey, {
      conversationId: 'conversation-1',
      hasMoreBefore: false,
      lastSequence: 12,
      messages: [message('10', 10), message('12', 12)],
    })
    listMessagesMock.mockResolvedValue({
      conversationId: 'conversation-1',
      hasMoreBefore: false,
      lastSequence: 12,
      messages: [message('11', 11), message('12', 12)],
    })

    await synchronizeBookingMessages(queryClient, bookingId)

    expect(listMessagesMock).toHaveBeenCalledWith(bookingId, {
      afterSequence: 10,
      limit: 100,
    })
    expect(
      queryClient
        .getQueryData<ChatMessageList>(queryKey)
        ?.messages.map((item) => item.sequence),
    ).toEqual([10, 11, 12])
    expect(
      queryClient.getQueryData<ChatMessageList>(queryKey)
        ?.synchronizedThroughSequence,
    ).toBe(12)
  })
})

function message(id: string, sequence: number) {
  return {
    content: `message-${sequence}`,
    createdAt: '2026-09-13T00:00:00.000Z',
    id,
    senderActorId: 'customer-1',
    senderActorType: 'customer' as const,
    senderName: 'Guest',
    sequence,
  }
}
