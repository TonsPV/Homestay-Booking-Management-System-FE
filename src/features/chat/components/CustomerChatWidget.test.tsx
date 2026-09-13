import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  conversations: {
    data: {
      data: [
        {
          booking: {
            bookingCode: 'HBMS-001',
            checkInDate: '2026-09-13',
            checkOutDate: '2026-09-14',
            id: 'booking-1',
            roomName: 'Phòng hướng vườn',
            roomNumber: 'A101',
            status: 'CONFIRMED',
          },
          id: 'conversation-1',
          lastMessage: {
            content: 'Tôi cần hỗ trợ giờ nhận phòng.',
            createdAt: '2026-09-12T08:00:00.000Z',
            senderActorId: 'customer-1',
            senderActorType: 'customer',
            sequence: 1,
          },
          lastSequence: 1,
          needsReply: false,
          unreadCount: 2,
        },
      ],
    },
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  },
  summary: {
    data: { needsReplyConversationCount: 0, unreadMessageCount: 2 },
  },
  useAuth: vi.fn(),
}))

vi.mock('@/app/config', () => ({
  appConfig: { chatEnabled: true },
}))

vi.mock('@/auth/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../hooks', () => ({
  useChatConversations: () => mocks.conversations,
  useChatSummary: () => mocks.summary,
}))

vi.mock('./ChatPanel', () => ({
  ChatPanel: ({
    bookingId,
    onBack,
    onBookingLink,
    onClose,
    onMinimize,
  }: {
    bookingId: string
    onBack?: () => void
    onBookingLink?: () => void
    onClose?: () => void
    onMinimize?: () => void
  }) => (
    <div data-testid="chat-panel">
      Đang trao đổi: {bookingId}
      <button onClick={onBack} type="button">
        Hộp thư
      </button>
      <button onClick={onBookingLink} type="button">
        Xem booking
      </button>
      <button onClick={onMinimize} type="button">
        Thu gọn
      </button>
      <button onClick={onClose} type="button">
        Đóng
      </button>
    </div>
  ),
}))

import { CustomerChatWidget } from './CustomerChatWidget'
import { CustomerChatWidgetProvider } from '../CustomerChatWidgetProvider'

function renderWidget(pathname = '/') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <CustomerChatWidgetProvider>
        <CustomerChatWidget />
      </CustomerChatWidgetProvider>
    </MemoryRouter>,
  )
}

describe('CustomerChatWidget', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    mocks.useAuth.mockReset()
    mocks.useAuth.mockReturnValue({
      principal: { actorType: 'customer', id: 'customer-1' },
    })
    mocks.conversations.refetch.mockReset()
  })

  it('opens a two-column booking messenger from the floating launcher', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }),
    )
    renderWidget()

    await user.click(
      screen.getByRole('button', { name: 'Mở hỗ trợ booking, 2 tin chưa đọc' }),
    )

    expect(screen.getByLabelText('Hộp thư hỗ trợ booking')).toBeInTheDocument()
    expect(screen.getByLabelText('Danh sách hội thoại')).toBeInTheDocument()
    expect(screen.getByLabelText('Chi tiết hội thoại')).toBeInTheDocument()
    expect(screen.getByText('Phòng hướng vườn')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByTestId('chat-panel')).toHaveTextContent(
        'Đang trao đổi: booking-1',
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Xem booking' }))

    expect(
      screen.getByRole('button', {
        name: 'Mở hỗ trợ booking, 2 tin chưa đọc',
      }),
    ).toBeInTheDocument()
  })

  it('keeps the launcher independent from the retired customer inbox route', () => {
    renderWidget('/messages')

    expect(
      screen.getByRole('button', { name: /Mở hỗ trợ booking/ }),
    ).toBeInTheDocument()
  })

  it('returns focus to the launcher after closing the widget', async () => {
    const user = userEvent.setup()
    renderWidget()
    const launcher = screen.getByRole('button', {
      name: 'Mở hỗ trợ booking, 2 tin chưa đọc',
    })

    await user.click(launcher)
    await user.click(
      screen.getByRole('button', { name: 'Đóng cửa sổ chat' }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Mở hỗ trợ booking, 2 tin chưa đọc',
        }),
      ).toHaveFocus(),
    )
  })
})
