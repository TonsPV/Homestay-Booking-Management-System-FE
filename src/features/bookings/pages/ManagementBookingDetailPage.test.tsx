import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom'

import { ApiError } from '@/api/errors'

import type { Booking } from '../types'
import { ManagementBookingDetailPage } from './ManagementBookingDetailPage'

const booking: Booking = {
  id: '42',
  bookingCode: 'BK-2026-0042',
  customerId: '12',
  roomId: '8',
  createdByUserId: '7',
  checkInDate: '2026-08-01',
  checkOutDate: '2026-08-03',
  guestCount: 2,
  contactName: 'Nguyễn Minh',
  contactPhone: '0901234567',
  contactEmail: 'minh@example.com',
  totalAmount: '1800000.00',
  status: 'PENDING_PAYMENT',
  paymentStatus: 'UNPAID',
  paymentExpiresAt: '2026-07-25T08:00:00.000Z',
  customerNote: null,
  cancelledAt: null,
  cancellationReason: null,
  customer: {
    id: '12',
    fullName: 'Nguyễn Minh',
    phone: '0901234567',
  },
  room: {
    id: '8',
    roomNumber: 'A102',
    name: 'Phòng hướng vườn',
    roomType: {
      id: '2',
      name: 'Phòng đôi',
    },
  },
  createdByUser: {
    id: '7',
    fullName: 'Lễ tân ca sáng',
  },
  createdAt: '2026-07-24T07:00:00.000Z',
  updatedAt: '2026-07-24T07:00:00.000Z',
}

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  updateError: null as ApiError | null,
}))

vi.mock(
  '@/features/payments/components/ManagementBookingPaymentPanel',
  () => ({
    ManagementBookingPaymentPanel: () => (
      <section aria-label="Thanh toán booking" />
    ),
  }),
)

vi.mock('../hooks', () => ({
  useManagementBooking: () => ({
    data: booking,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useUpdateBookingStatus: () => ({
    error: mocks.updateError,
    isError: mocks.updateError !== null,
    isPending: false,
    mutate: mocks.mutate,
    reset: mocks.reset,
  }),
}))

describe('ManagementBookingDetailPage cancellation safety', () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
    mocks.reset.mockReset()
    mocks.updateError = null
  })

  it('requires an explicit contextual confirmation before cancelling', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/management/bookings/42']}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Trạng thái tiếp theo' }),
      'CANCELLED',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Lý do hủy' }),
      'Khách đổi kế hoạch',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cập nhật trạng thái' }),
    )

    expect(mocks.mutate).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', {
        name: `Hủy booking ${booking.bookingCode}?`,
      })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText(booking.contactName)).toBeInTheDocument()
    expect(
      within(dialog).getByText(/A102 · Phòng hướng vườn/),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('Khách đổi kế hoạch'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hủy booking' }),
    )

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        id: booking.id,
        input: {
          status: 'CANCELLED',
          cancellationReason: 'Khách đổi kế hoạch',
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    )
  }, 15_000)

  it('submits the selected target status and leaves validation to Backend', async () => {
    const user = userEvent.setup()
    mocks.mutate.mockImplementation(
      (
        _variables,
        options?: { onSuccess?: () => void },
      ) => options?.onSuccess?.(),
    )
    render(
      <MemoryRouter initialEntries={['/management/bookings/42']}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    )

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Trạng thái tiếp theo' }),
      'CHECKED_OUT',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cập nhật trạng thái' }),
    )

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        id: booking.id,
        input: {
          status: 'CHECKED_OUT',
          cancellationReason: undefined,
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    expect(
      screen.getByText('Đã cập nhật trạng thái booking.'),
    ).toBeInTheDocument()
  })

  it('shows an authoritative Backend conflict', () => {
    mocks.updateError = new ApiError(
      'Khong the chuyen booking tu PENDING_PAYMENT sang CHECKED_OUT.',
      { kind: 'http', status: 409 },
    )

    render(
      <MemoryRouter initialEntries={['/management/bookings/42']}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Phòng vừa được người khác đặt.',
    )
  })
})
