import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const readAuthSessionMock = vi.hoisted(() => vi.fn())
const sendMutateMock = vi.hoisted(() => vi.fn())
const sendMutationState = vi.hoisted(() => ({
  error: null as unknown,
  isError: false,
  isPending: false,
}))
const useAuthMock = vi.hoisted(() => vi.fn())

vi.mock('@/app/config', () => ({
  appConfig: { chatEnabled: true },
}))

vi.mock('@/auth/session-storage', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/auth/useAuth', () => ({
  useAuth: useAuthMock,
}))

vi.mock('../hooks', () => ({
  useChatBookingContext: () => ({
    data: {
      booking: {
        bookingCode: 'HBMS-001',
        checkInDate: '2026-09-13',
        checkOutDate: '2026-09-14',
        roomNumber: '101',
        roomName: 'Phòng hướng vườn',
        status: 'CONFIRMED',
      },
      unreadCount: 0,
    },
    isError: false,
    isPending: false,
  }),
  useChatMessages: () => ({
    data: {
      conversationId: null,
      hasMoreBefore: false,
      lastSequence: 0,
      messages: [],
    },
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useLoadOlderChatMessages: () => ({
    isError: false,
    isPending: false,
    mutate: vi.fn(),
  }),
  useMarkChatRead: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
  useSendChatMessage: () => ({
    ...sendMutationState,
    mutate: sendMutateMock,
  }),
}))

import { ChatPanel } from './ChatPanel'

function customer(id: string) {
  return { actorType: 'customer' as const, id }
}

function sendMessage(content = 'Can ho tro booking nay?') {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: content } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }))
  const call = sendMutateMock.mock.calls.at(-1)
  expect(call).toBeDefined()
  return call as [
    { bookingId: string; input: { clientMessageId: string; content: string } },
    { onError: () => void; onSuccess: () => void },
  ]
}

describe('ChatPanel', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    sendMutateMock.mockReset()
    useAuthMock.mockReset()
    sendMutationState.error = null
    sendMutationState.isError = false
    sendMutationState.isPending = false
    readAuthSessionMock.mockReturnValue({ accessToken: 'session-a' })
    useAuthMock.mockReturnValue({ principal: customer('customer-a') })
  })

  it('does not expose a failed booking A message after the panel switches to booking B', () => {
    const view = render(<ChatPanel bookingId="booking-a" />)
    const [, callbacks] = sendMessage('Only booking A may see this')

    sendMutationState.error = new Error('Booking A request failed')
    sendMutationState.isError = true
    view.rerender(<ChatPanel bookingId="booking-b" />)

    act(() => callbacks.onError())

    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.queryByText('Only booking A may see this')).not.toBeInTheDocument()
    expect(screen.queryByText('Booking A request failed')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Gửi lại' }),
    ).not.toBeInTheDocument()
  })

  it('drops an old callback when the authenticated account session changes', () => {
    const view = render(<ChatPanel bookingId="booking-a" />)
    const [, callbacks] = sendMessage('Do not carry this into another account')

    readAuthSessionMock.mockReturnValue({ accessToken: 'session-b' })
    useAuthMock.mockReturnValue({ principal: customer('customer-b') })
    view.rerender(<ChatPanel bookingId="booking-a" />)

    act(() => callbacks.onError())

    expect(
      screen.queryByText('Do not carry this into another account'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Gửi lại' }),
    ).not.toBeInTheDocument()
  })

  it('retries a failed message against the booking captured with that message', () => {
    render(<ChatPanel bookingId="booking-a" />)
    const [firstRequest, callbacks] = sendMessage('Retry must stay in booking A')

    act(() => callbacks.onError())
    fireEvent.click(screen.getByRole('button', { name: 'Gửi lại' }))

    const [retryRequest] = sendMutateMock.mock.calls.at(-1) as [
      { bookingId: string; input: { clientMessageId: string; content: string } },
    ]
    expect(retryRequest.bookingId).toBe('booking-a')
    expect(retryRequest.input.clientMessageId).toBe(
      firstRequest.input.clientMessageId,
    )
  })

  it('keeps the attached room and stay details visible above the conversation', () => {
    const onBookingLink = vi.fn()
    render(
      <MemoryRouter>
        <ChatPanel
          bookingHref="/bookings/booking-a"
          bookingId="booking-a"
          onBookingLink={onBookingLink}
        />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Booking đang trao đổi')).toHaveTextContent(
      'Phòng hướng vườn',
    )
    expect(screen.getByLabelText('Booking đang trao đổi')).toHaveTextContent(
      'Đã xác nhận',
    )
    const bookingLink = screen.getByRole('link', {
      name: 'Xem chi tiết booking',
    })
    expect(bookingLink).toHaveAttribute(
      'href',
      '/bookings/booking-a',
    )
    fireEvent.click(bookingLink)
    expect(onBookingLink).toHaveBeenCalledTimes(1)
  })
})
