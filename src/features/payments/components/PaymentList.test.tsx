import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { Payment } from '../types'
import { PaymentList } from './PaymentList'

const payment: Payment = {
  id: '91',
  bookingId: '42',
  amount: '1250000.00',
  currency: 'VND',
  method: 'BANK_TRANSFER',
  status: 'SUCCESS',
  reviewReason: null,
  reviewCanonicalPaymentId: null,
  gatewayName: 'Internal transfer',
  gatewayReference: 'GW-REF-2026',
  gatewayTransactionId: 'BANK-TXN-91',
  gatewayResponseCode: '00',
  gatewayTransactionStatus: 'SETTLED',
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

describe('PaymentList management view', () => {
  it('exposes a semantic six-column table, booking links, and a payment-detail link', () => {
    render(
      <MemoryRouter>
        <PaymentList management payments={[payment]} />
      </MemoryRouter>,
    )

    const table = screen.getByRole('table', {
      name: 'Danh sách giao dịch thanh toán toàn hệ thống',
    })
    expect(table).toBeInTheDocument()
    const columnHeaders = screen.getAllByRole('columnheader')
    expect(columnHeaders.map((header) => header.textContent)).toEqual([
      'Giao dịch',
      'Đặt phòng',
      'Phương thức',
      'Số tiền',
      'Trạng thái',
      'Thời gian & Thao tác',
    ])
    for (const header of columnHeaders) {
      expect(header).toHaveAttribute('scope', 'col')
    }

    // Technical gateway/reconciliation metadata must not appear in the list;
    // it lives on /management/payments/:id now.
    expect(screen.queryByText('GW-REF-2026')).not.toBeInTheDocument()
    expect(screen.queryByText('BANK-TXN-91')).not.toBeInTheDocument()

    for (const link of screen.getAllByRole('link', { name: '#42' })) {
      expect(link).toHaveAttribute('href', '/management/bookings/42')
    }

    const detailLinks = screen.getAllByRole('link', { name: 'Xem chi tiết' })
    expect(detailLinks.length).toBeGreaterThan(0)
    for (const link of detailLinks) {
      expect(link).toHaveAttribute('href', '/management/payments/91')
    }
  }, 15_000)

  it('gives each refund action a transaction-specific accessible name', async () => {
    const user = userEvent.setup()
    const onRefund = vi.fn()
    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onRefund={onRefund}
          payments={[payment]}
        />
      </MemoryRouter>,
    )

    const refundActions = screen.getAllByRole('button', {
      name: 'Hoàn tiền giao dịch #91',
    })
    await user.click(refundActions[0])

    expect(onRefund).toHaveBeenCalledWith(payment)
  }, 15_000)

  it('offers reconciliation instead of another refund while VNPay is pending', async () => {
    const user = userEvent.setup()
    const onReconcile = vi.fn()
    const pendingRefund: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REFUND_PENDING',
      refundRequestId: 'R123',
      refundRequestedAt: '2026-07-24T09:00:00.000Z',
    }

    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onReconcile={onReconcile}
          payments={[pendingRefund]}
        />
      </MemoryRouter>,
    )

    const reconcileActions = screen.getAllByRole('button', {
      name: 'Đối soát hoàn tiền giao dịch #91',
    })
    expect(
      screen.queryByRole('button', {
        name: 'Hoàn tiền giao dịch #91',
      }),
    ).not.toBeInTheDocument()

    await user.click(reconcileActions[0])
    expect(onReconcile).toHaveBeenCalledWith(pendingRefund)
  }, 15_000)

  it('disables the active reconciliation action to prevent double submit', () => {
    const pendingRefund: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REFUND_PENDING',
    }

    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onReconcile={vi.fn()}
          payments={[pendingRefund]}
          reconcilingPaymentId="91"
        />
      </MemoryRouter>,
    )

    for (const button of screen.getAllByRole('button', {
      name: 'Đối soát hoàn tiền giao dịch #91',
    })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    }
  })
})

describe('PaymentList review-reason business-state matrix', () => {
  it('REQUIRES_REVIEW + BOOKING_CANCELLED: standard refund shown, duplicate resolution hidden, late-payment copy', () => {
    const latePayment: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REQUIRES_REVIEW',
      reviewReason: 'BOOKING_CANCELLED',
      gatewayReference: 'P91',
      gatewayTransactionId: 'TXN91',
    }

    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onRefund={vi.fn()}
          onResolveDuplicate={vi.fn()}
          payments={[latePayment]}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getAllByText('Thanh toán sau khi đặt phòng đã hủy').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/VNPay báo thanh toán thành công sau khi đặt phòng đã hủy/)
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: 'Hoàn tiền giao dịch #91' })
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng #91' }),
    ).not.toBeInTheDocument()
  })

  it('REQUIRES_REVIEW + ANOTHER_SUCCESSFUL_PAYMENT: duplicate resolution shown, standard refund hidden', () => {
    const duplicateCharge: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REQUIRES_REVIEW',
      reviewReason: 'ANOTHER_SUCCESSFUL_PAYMENT',
      reviewCanonicalPaymentId: '90',
      gatewayReference: 'P91',
      gatewayTransactionId: 'TXN91',
    }
    const onResolveDuplicate = vi.fn()

    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onResolveDuplicate={onResolveDuplicate}
          payments={[duplicateCharge]}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getAllByText('Trùng thanh toán cho cùng đặt phòng').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        /Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng/,
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Hoàn tiền giao dịch #91' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Xử lý giao dịch trùng #91' })
        .length,
    ).toBeGreaterThan(0)
  })

  it('REQUIRES_REVIEW without a distinct reason keeps the generic review copy but no refund button for duplicates', () => {
    const orphanDuplicate: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REQUIRES_REVIEW',
      reviewReason: 'ANOTHER_SUCCESSFUL_PAYMENT',
      reviewCanonicalPaymentId: null,
      gatewayReference: 'P91',
      gatewayTransactionId: 'TXN91',
    }

    render(
      <MemoryRouter>
        <PaymentList canRefund management payments={[orphanDuplicate]} />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('button', { name: 'Hoàn tiền giao dịch #91' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng #91' }),
    ).not.toBeInTheDocument()
  })

  it('SUCCESS shows only the standard refund action', () => {
    const successful: Payment = { ...payment, method: 'VNPAY' }

    render(
      <MemoryRouter>
        <PaymentList
          canRefund
          management
          onRefund={vi.fn()}
          onResolveDuplicate={vi.fn()}
          payments={[successful]}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getAllByRole('button', { name: 'Hoàn tiền giao dịch #91' })
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng #91' }),
    ).not.toBeInTheDocument()
  })

  it('REFUNDED exposes no money actions', () => {
    const refunded: Payment = {
      ...payment,
      method: 'VNPAY',
      status: 'REFUNDED',
      refundedAt: '2026-07-29T01:05:00.000Z',
      refundRequestId: 'R91',
    }

    render(
      <MemoryRouter>
        <PaymentList canRefund management payments={[refunded]} />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('button', { name: 'Hoàn tiền giao dịch #91' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Xử lý giao dịch trùng #91' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Đối soát hoàn tiền giao dịch #91' }),
    ).not.toBeInTheDocument()
  })

  it('omits the payment-detail link for non-management (customer) lists', () => {
    render(
      <MemoryRouter>
        <PaymentList payments={[payment]} />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('link', { name: 'Xem chi tiết' }),
    ).not.toBeInTheDocument()
  })

  it('keeps Staff payment and booking links inside the staff workspace', () => {
    render(
      <MemoryRouter>
        <PaymentList
          bookingBasePath="/staff/bookings"
          management
          paymentBasePath="/staff/payments"
          payments={[payment]}
        />
      </MemoryRouter>,
    )

    for (const link of screen.getAllByRole('link', { name: '#42' })) {
      expect(link).toHaveAttribute('href', '/staff/bookings/42')
    }
    for (const link of screen.getAllByRole('link', { name: 'Xem chi tiết' })) {
      expect(link).toHaveAttribute('href', '/staff/payments/91')
    }
  })
})
