import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import type { Payment } from '../types'
import { PaymentDetailPage } from './PaymentDetailPage'

const mocks = vi.hoisted(() => ({
  useManagementPayment: vi.fn(),
  useReconcileVnPayRefund: vi.fn(),
  useRefundPayment: vi.fn(),
  useResolveDuplicateCharge: vi.fn(),
}))

const authMock = vi.hoisted(() => {
  type Principal = {
    actorType: string
    role: string
  }

  return {
    useAuth: vi.fn<() => { principal: Principal }>(() => ({
      principal: {
        actorType: 'user',
        role: 'ADMIN',
      },
    })),
  }
})

vi.mock('@/auth/useAuth', () => authMock)

vi.mock('../hooks', () => ({
  useManagementPayment: mocks.useManagementPayment,
  useReconcileVnPayRefund: mocks.useReconcileVnPayRefund,
  useRefundPayment: mocks.useRefundPayment,
  useResolveDuplicateCharge: mocks.useResolveDuplicateCharge,
}))

const vnpayPayment: Payment = {
  id: '91',
  bookingId: '42',
  amount: '1250000.00',
  currency: 'VND',
  method: 'VNPAY',
  status: 'SUCCESS',
  reviewReason: null,
  reviewCanonicalPaymentId: null,
  gatewayName: 'VNPay',
  gatewayReference: 'P91REF',
  gatewayTransactionId: 'TXN91',
  gatewayResponseCode: '00',
  gatewayTransactionStatus: 'SETTLED',
  gatewayTransactionDate: '2026-07-24T08:30:00.000Z',
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/management/payments/91']}>
      <PaymentDetailPage />
    </MemoryRouter>,
  )
}

function mutationMock(overrides: Record<string, unknown> = {}) {
  return {
    error: null,
    isError: false,
    isPending: false,
    mutate: vi.fn(),
    reset: vi.fn(),
    variables: undefined,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  mocks.useManagementPayment.mockReturnValue({
    data: vnpayPayment,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  })
  mocks.useRefundPayment.mockReturnValue(mutationMock())
  mocks.useReconcileVnPayRefund.mockReturnValue(mutationMock())
  mocks.useResolveDuplicateCharge.mockReturnValue(mutationMock())
})

describe('PaymentDetailPage overview', () => {
  it('renders transaction overview, VNPay gateway metadata, and booking link', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Giao dịch #91' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tổng quan giao dịch')).toBeInTheDocument()
    expect(screen.getByText('Thông số kỹ thuật cổng thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Thông tin hoàn tiền & Đối soát')).toBeInTheDocument()

    const bookingLink = screen.getByRole('link', { name: '#42' })
    expect(bookingLink).toHaveAttribute('href', '/management/bookings/42')

    expect(screen.getByText('P91REF')).toBeInTheDocument()
    expect(screen.getByText('TXN91')).toBeInTheDocument()
    expect(screen.getByText('SETTLED')).toBeInTheDocument()

    const backLink = screen.getByRole('link', {
      name: 'Quay lại danh sách',
    })
    expect(backLink).toHaveAttribute('href', '/management/payments')
  })

  it('hides money actions from non-admin users', () => {
    authMock.useAuth.mockReturnValue({
      principal: {
        actorType: 'customer',
        role: 'CUSTOMER',
      },
    })

    renderPage()

    expect(
      screen.queryByRole('button', { name: 'Hoàn tiền' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Đối soát hoàn tiền' }),
    ).not.toBeInTheDocument()

    authMock.useAuth.mockReturnValue({
      principal: {
        actorType: 'user' as const,
        role: 'ADMIN' as const,
      },
    })
  })
})

describe('PaymentDetailPage actions', () => {
  it('offers reconcile instead of refund while VNPay refund is pending', async () => {
    const user = userEvent.setup()
    const reconcile = vi.fn()
    mocks.useManagementPayment.mockReturnValue({
      data: {
        ...vnpayPayment,
        status: 'REFUND_PENDING',
        refundRequestId: 'R91',
        refundRequestedAt: '2026-07-24T09:00:00.000Z',
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useReconcileVnPayRefund.mockReturnValue(mutationMock({ mutate: reconcile }))

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Đối soát hoàn tiền' }))
    expect(reconcile).toHaveBeenCalledWith('91', expect.anything())
    expect(
      screen.queryByRole('button', { name: 'Hoàn tiền' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng' }),
    ).not.toBeInTheDocument()
  })

  it('resolves a duplicate charge through the confirmation dialog', async () => {
    const user = userEvent.setup()
    const resolveDuplicate = vi.fn()
    mocks.useManagementPayment.mockReturnValue({
      data: {
        ...vnpayPayment,
        status: 'REQUIRES_REVIEW',
        reviewReason: 'ANOTHER_SUCCESSFUL_PAYMENT',
        reviewCanonicalPaymentId: '90',
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
    mocks.useResolveDuplicateCharge.mockReturnValue(
      mutationMock({ mutate: resolveDuplicate }),
    )

    renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Xử lý giao dịch trùng' }),
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Xử lý giao dịch trùng?')
    expect(screen.getByRole('link', { name: '#90' })).toHaveAttribute(
      'href',
      '/management/payments/90',
    )

    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn giao dịch trùng' }),
    )
    expect(resolveDuplicate).toHaveBeenCalledTimes(1)
    expect(resolveDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: '91',
        idempotencyKey: expect.any(String),
      }),
      expect.anything(),
    )
  })

  it('refunds an eligible payment with a persisted idempotency key', async () => {
    const user = userEvent.setup()
    const refund = vi.fn()
    mocks.useRefundPayment.mockReturnValue(mutationMock({ mutate: refund }))

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Hoàn tiền' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Hoàn tiền giao dịch này?')

    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn tiền' }),
    )
    expect(refund).toHaveBeenCalledTimes(1)
    const { idempotencyKey, paymentId } = refund.mock.calls[0][0]
    expect(paymentId).toBe('91')
    expect(typeof idempotencyKey).toBe('string')
    expect(idempotencyKey.length).toBeGreaterThan(0)

    // Reopening the dialog must reuse the same in-flight attempt key.
    refund.mockClear()
    await user.click(screen.getByRole('button', { name: 'Hoàn tiền' }))
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hoàn tiền' }),
    )
    expect(refund.mock.calls[0][0].idempotencyKey).toBe(idempotencyKey)
  })
})
