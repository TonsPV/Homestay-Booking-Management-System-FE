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
  it('exposes a semantic table, reconciliation identifiers, and booking links', () => {
    render(
      <MemoryRouter>
        <PaymentList management payments={[payment]} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('table', {
        name: 'Danh sách giao dịch thanh toán toàn hệ thống',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Đối soát' }),
    ).toHaveAttribute('scope', 'col')
    expect(screen.getAllByText('GW-REF-2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('BANK-TXN-91').length).toBeGreaterThan(0)

    for (const link of screen.getAllByRole('link', { name: '#42' })) {
      expect(link).toHaveAttribute('href', '/management/bookings/42')
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
