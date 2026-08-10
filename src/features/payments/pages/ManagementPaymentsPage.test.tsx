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
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import type { Payment } from '../types'
import { ManagementPaymentsPage } from './ManagementPaymentsPage'

const mocks = vi.hoisted(() => ({
  useManagementBooking: vi.fn(),
  useManagementPayments: vi.fn(),
  useReconcileVnPayRefund: vi.fn(),
  useRefundPayment: vi.fn(),
}))

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    principal: {
      actorType: 'user',
      role: 'ADMIN',
    },
  }),
}))

vi.mock('@/features/bookings', () => ({
  useManagementBooking: mocks.useManagementBooking,
}))

vi.mock('../hooks', () => ({
  useManagementPayments: mocks.useManagementPayments,
  useReconcileVnPayRefund: mocks.useReconcileVnPayRefund,
  useRefundPayment: mocks.useRefundPayment,
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
      <ManagementPaymentsPage />
    </>
  )
}

const refundablePayment: Payment = {
  id: '91',
  bookingId: '42',
  amount: '1250000.00',
  currency: 'VND',
  method: 'CASH',
  status: 'SUCCESS',
  reviewReason: null,
  reviewCanonicalPaymentId: null,
  gatewayName: null,
  gatewayReference: null,
  gatewayTransactionId: null,
  gatewayResponseCode: null,
  gatewayTransactionStatus: null,
  gatewayTransactionDate: null,
  refundRequestId: null,
  refundPreviousStatus: null,
  refundGatewayTransactionId: null,
  refundResponseCode: null,
  refundTransactionStatus: null,
  refundMessage: null,
  refundReason: null,
  createdByUserId: '7',
  refundedByUserId: null,
  paidAt: '2026-07-24T08:30:00.000Z',
  refundedAt: null,
  refundRequestedAt: null,
  refundLastQueriedAt: null,
  expiresAt: null,
  createdByUser: {
    id: '7',
    fullName: 'Nguyễn Thu Ngân',
  },
  refundedByUser: null,
  createdAt: '2026-07-24T08:25:00.000Z',
  updatedAt: '2026-07-24T08:30:00.000Z',
}

describe('ManagementPaymentsPage filters', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.useManagementBooking.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useManagementPayments.mockReturnValue({
      data: {
        data: [],
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 0,
            totalPages: 0,
          },
          staleRefundCount: 0,
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useRefundPayment.mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    })
    mocks.useReconcileVnPayRefund.mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    })
  })

  it('keeps controls synchronized with browser history', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/management/payments?status=FAILED&method=CASH',
          '/management/payments?status=REQUIRES_REVIEW&method=VNPAY',
        ]}
        initialIndex={1}
      >
        <BackHarness />
      </MemoryRouter>,
    )

    const status = screen.getByRole('combobox', { name: 'Trạng thái' })
    const method = screen.getByRole('combobox', { name: 'Phương thức' })
    expect(status).toHaveValue('REQUIRES_REVIEW')
    expect(method).toHaveValue('VNPAY')

    await user.click(
      screen.getByRole('button', { name: 'Quay lại lịch sử' }),
    )

    await waitFor(() => {
      expect(status).toHaveValue('FAILED')
      expect(method).toHaveValue('CASH')
    })
  }, 15_000)

  it('updates both URL and controls for the review queue and reset', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/management/payments']}>
        <LocationProbe />
        <ManagementPaymentsPage />
      </MemoryRouter>,
    )

    const status = screen.getByRole('combobox', { name: 'Trạng thái' })
    await user.click(
      screen.getByRole('button', { name: 'Hàng đợi đối soát' }),
    )

    await waitFor(() => {
      expect(status).toHaveValue('REQUIRES_REVIEW')
      expect(screen.getByTestId('location')).toHaveTextContent(
        '?status=REQUIRES_REVIEW',
      )
    })

    await user.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => {
      expect(status).toHaveValue('')
      expect(screen.getByTestId('location')).toHaveTextContent(/^$/)
    })
  }, 15_000)

  it('shows Backend stale-refund metadata and opens the pending queue', async () => {
    const user = userEvent.setup()
    mocks.useManagementPayments.mockReturnValue({
      data: {
        data: [],
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 0,
            totalPages: 0,
          },
          staleRefundCount: 2,
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/management/payments']}>
        <LocationProbe />
        <ManagementPaymentsPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/2 giao dịch cần được kiểm tra/i),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Refund quá hạn (2)' }),
    )

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '?method=VNPAY&status=REFUND_PENDING',
      )
    })
  })

  it('requires contextual confirmation before refunding', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    mocks.useManagementPayments.mockReturnValue({
      data: {
        data: [refundablePayment],
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 1,
            totalPages: 1,
          },
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useManagementBooking.mockReturnValue({
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useRefundPayment.mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutate,
      reset: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/management/payments']}>
        <ManagementPaymentsPage />
      </MemoryRouter>,
    )

    await user.click(
      screen.getAllByRole('button', {
        name: `Hoàn tiền giao dịch #${refundablePayment.id}`,
      })[0],
    )

    expect(mutate).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', {
        name: `Hoàn tiền payment #${refundablePayment.id}?`,
      })
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByRole('link', {
        name: `#${refundablePayment.bookingId}`,
      }),
    ).toHaveAttribute(
      'href',
      `/management/bookings/${refundablePayment.bookingId}`,
    )
    expect(within(dialog).getByText('1.250.000 ₫')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn tiền' }),
    )

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          paymentId: refundablePayment.id,
          idempotencyKey: expect.any(String),
          input: { reason: undefined },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      )
    })

    const firstKey = mutate.mock.calls[0]?.[0].idempotencyKey
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn tiền' }),
    )
    const retryKey = mutate.mock.calls[1]?.[0].idempotencyKey

    expect(retryKey).toBe(firstKey)
  }, 15_000)
})
