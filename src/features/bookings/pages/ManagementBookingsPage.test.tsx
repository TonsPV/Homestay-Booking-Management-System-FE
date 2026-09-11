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
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { ManagementBookingsPage } from './ManagementBookingsPage'

const mocks = vi.hoisted(() => ({
  useManagementBookings: vi.fn(),
}))

vi.mock('../hooks', () => ({
  useManagementBookings: mocks.useManagementBookings,
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function BackHarness() {
  const navigate = useNavigate()

  return (
    <>
      <button onClick={() => navigate(-1)} type="button">
        Quay lại lịch sử
      </button>
      <LocationProbe />
      <ManagementBookingsPage />
    </>
  )
}

describe('ManagementBookingsPage filters', () => {
  beforeEach(() => {
    mocks.useManagementBookings.mockReturnValue({
      data: {
        data: [],
        meta: {
          pagination: {
            limit: 10,
            page: 1,
            total: 0,
            totalPages: 0,
          },
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
  })

  it('renders summary stat cards derived from the current page bookings', () => {
    const baseBooking = {
      id: '1',
      bookingCode: 'BK-001',
      customerId: '12',
      roomId: '8',
      createdByUserId: null,
      checkInDate: '2026-09-12',
      checkOutDate: '2026-09-14',
      guestCount: 2,
      contactName: 'Lan',
      contactPhone: '0901',
      contactEmail: null,
      totalAmount: '1250000.00',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      paymentExpiresAt: null,
      customerNote: null,
      cancelledAt: null,
      cancellationReason: null,
      customer: { id: '12', fullName: 'Lan', phone: '0901' },
      room: {
        id: '8',
        roomNumber: 'A101',
        name: 'Phòng A',
        roomType: { id: '2', name: 'Phòng đôi' },
      },
      createdByUser: null,
      createdAt: '2026-09-10T01:00:00.000Z',
      updatedAt: '2026-09-10T01:00:00.000Z',
      credentialCapabilities: {
        canSetInitialPassword: false,
        reasonCode: null,
      },
      transitionCapabilities: [],
    }
    const pageBookings = [
      baseBooking,
      {
        ...baseBooking,
        id: '2',
        bookingCode: 'BK-002',
        totalAmount: '1450000.00',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      {
        ...baseBooking,
        id: '3',
        bookingCode: 'BK-003',
        totalAmount: '800000.00',
        status: 'CHECKED_IN',
        paymentStatus: 'PAID',
      },
    ]

    mocks.useManagementBookings.mockReturnValue({
      data: {
        data: pageBookings,
        meta: {
          pagination: { limit: 10, page: 1, total: 3, totalPages: 1 },
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/management/bookings']}>
        <ManagementBookingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Đơn chờ xử lý')).toBeInTheDocument()
    expect(screen.getByText('Đơn đã xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Tổng tiền hiển thị')).toBeInTheDocument()
    expect(screen.getByText('Lối tắt')).toBeInTheDocument()

    // Count cards reflect the statuses on the current page (1 pending, 1
    // confirmed); the money card sums the current page's totalAmount column
    // (1.25m + 1.45m + 0.8m) via exact decimal-string addition.
    expect(screen.getByTestId('stat-pending-payment')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-displayed-total')).toHaveTextContent(
      /3\.500\.000/,
    )

    expect(
      screen.getByRole('link', { name: /Quản lý thanh toán/ }),
    ).toHaveAttribute('href', '/management/payments')
  })

  it('keeps all controls synchronized with browser history', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/management/bookings?status=CONFIRMED&search=Lan&customerId=12&roomId=8',
          '/management/bookings?status=CHECKED_IN&search=Minh&customerId=30&roomId=9',
        ]}
        initialIndex={1}
      >
        <BackHarness />
      </MemoryRouter>,
    )

    const status = screen.getByRole('combobox', { name: 'Trạng thái' })
    const search = screen.getByRole('textbox', { name: 'Tìm kiếm' })
    const customerId = screen.getByRole('textbox', {
      name: 'Mã khách hàng',
    })
    const roomId = screen.getByRole('textbox', { name: 'Mã phòng' })
    expect(status).toHaveValue('CHECKED_IN')
    expect(search).toHaveValue('Minh')
    expect(customerId).toHaveValue('30')
    expect(roomId).toHaveValue('9')

    await user.click(
      screen.getByRole('button', { name: 'Quay lại lịch sử' }),
    )

    await waitFor(() => {
      expect(status).toHaveValue('CONFIRMED')
      expect(search).toHaveValue('Lan')
      expect(customerId).toHaveValue('12')
      expect(roomId).toHaveValue('8')
    })
  }, 15_000)

  it('clears both the URL and visible controls', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/management/bookings?status=CONFIRMED&search=Lan&customerId=12&roomId=8',
        ]}
      >
        <LocationProbe />
        <ManagementBookingsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: 'Trạng thái' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Tìm kiếm' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Mã khách hàng' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Mã phòng' }),
      ).toHaveValue('')
      expect(screen.getByTestId('location')).toHaveTextContent(/^$/)
    })
  }, 15_000)
})
