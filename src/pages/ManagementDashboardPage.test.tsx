import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DashboardSummary } from '@/features/dashboard'

import { ManagementDashboardPage } from './ManagementDashboardPage'

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  useDashboardSummary: vi.fn(),
}))

vi.mock('@/features/dashboard', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/features/dashboard')>()

  return {
    ...original,
    useDashboardSummary: mocks.useDashboardSummary,
  }
})

const summary: DashboardSummary = {
  fromDate: '2026-07-01',
  toDate: '2026-07-29',
  bookings: {
    pendingPayment: 1,
    confirmed: 2,
    checkedIn: 3,
    checkedOut: 4,
    cancelled: 5,
  },
  rooms: {
    ready: 6,
    occupied: 3,
    cleaning: 1,
    maintenance: 0,
  },
  revenue: {
    vnpay: 1_000_000,
    manual: 500_000,
    total: 1_500_000,
  },
  totalRefunded: 100_000,
  payments: {
    requiresReview: 1,
    refundPending: 2,
  },
  occupancy: {
    roomNightsReserved: 12,
    roomNightsAvailable: 20,
    occupancyRate: 60,
  },
  generatedAt: '2026-07-29T04:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ManagementDashboardPage />
    </MemoryRouter>,
  )
}

describe('ManagementDashboardPage', () => {
  beforeEach(() => {
    mocks.refetch.mockReset()
    mocks.useDashboardSummary.mockReset().mockReturnValue({
      data: summary,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: mocks.refetch,
    })
  })

  it('renders real summary values, supported queue links, and useful actions', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Tổng quan vận hành' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1.500.000 ₫')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Công suất phòng 60%',
      }),
    ).toHaveAttribute('aria-valuenow', '60')
    expect(
      screen.getByRole('link', { name: 'Chờ thanh toán' }),
    ).toHaveAttribute(
      'href',
      '/management/bookings?status=PENDING_PAYMENT',
    )
    expect(
      screen.getByRole('link', { name: /^Cần đối soát/ }),
    ).toHaveAttribute(
      'href',
      '/management/payments?status=REQUIRES_REVIEW',
    )
    expect(
      screen.getByRole('link', { name: 'Tạo booking tại quầy' }),
    ).toHaveAttribute('href', '/management/bookings/new')

    const bookingSection = screen
      .getByRole('heading', { name: 'Booking theo trạng thái' })
      .closest('div.rounded-panel')

    expect(bookingSection).not.toBeNull()
    expect(within(bookingSection as HTMLElement).getByText('5')).toBeInTheDocument()
  })

  it('treats an all-zero period as valid data instead of an error', () => {
    mocks.useDashboardSummary.mockReturnValue({
      data: {
        ...summary,
        bookings: {
          pendingPayment: 0,
          confirmed: 0,
          checkedIn: 0,
          checkedOut: 0,
          cancelled: 0,
        },
        revenue: { vnpay: 0, manual: 0, total: 0 },
        totalRefunded: 0,
        payments: { requiresReview: 0, refundPending: 0 },
        occupancy: {
          roomNightsReserved: 0,
          roomNightsAvailable: 0,
          occupancyRate: 0,
        },
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: mocks.refetch,
    })

    renderPage()

    expect(
      screen.getByText('Không có phát sinh trong kỳ'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Có lỗi xảy ra' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Công suất phòng 0%',
      }),
    ).toBeInTheDocument()
  })

  it('shows loading and retryable error states', async () => {
    const { rerender } = renderPage()

    mocks.useDashboardSummary.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: true,
      isPending: true,
      refetch: mocks.refetch,
    })
    rerender(
      <MemoryRouter>
        <ManagementDashboardPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByText('Đang tổng hợp dữ liệu vận hành…'),
    ).toBeInTheDocument()

    mocks.useDashboardSummary.mockReturnValue({
      data: undefined,
      error: new Error('Dashboard tạm thời không khả dụng.'),
      isError: true,
      isFetching: false,
      isPending: false,
      refetch: mocks.refetch,
    })
    rerender(
      <MemoryRouter>
        <ManagementDashboardPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Dashboard tạm thời không khả dụng.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(mocks.refetch).toHaveBeenCalledOnce()
  })

  it('validates the range before applying it to the API query', async () => {
    const user = userEvent.setup()
    renderPage()

    fireEvent.change(screen.getByLabelText(/Từ ngày/), {
      target: { value: '2026-07-30' },
    })
    fireEvent.change(screen.getByLabelText(/Đến ngày/), {
      target: { value: '2026-07-01' },
    })
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }))

    expect(
      await screen.findByText(
        'Ngày bắt đầu không được sau ngày kết thúc.',
      ),
    ).toBeInTheDocument()
    expect(
      mocks.useDashboardSummary.mock.calls.some(
        ([query]) =>
          query.from === '2026-07-30' && query.to === '2026-07-01',
      ),
    ).toBe(false)

    fireEvent.change(screen.getByLabelText(/Từ ngày/), {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(screen.getByLabelText(/Đến ngày/), {
      target: { value: '2026-07-15' },
    })
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }))

    await waitFor(() => {
      expect(mocks.useDashboardSummary).toHaveBeenLastCalledWith({
        from: '2026-07-01',
        to: '2026-07-15',
      })
    })
  })
})
