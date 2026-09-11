import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CustomerPayment } from '../types'
import { CustomerPaymentHistory } from './CustomerPaymentHistory'

const pendingPayment: CustomerPayment = {
  amount: '1250000.00',
  bookingId: '42',
  createdAt: '2026-07-24T08:25:00.000Z',
  currency: 'VND',
  expiresAt: '2026-07-24T08:40:00.000Z',
  gatewayReference: 'SAFE-MERCHANT-REFERENCE',
  id: '91',
  method: 'VNPAY',
  paidAt: null,
  refundedAt: null,
  status: 'PENDING',
  updatedAt: '2026-07-24T08:25:00.000Z',
}

const reviewPayment: CustomerPayment = {
  ...pendingPayment,
  id: '92',
  status: 'REQUIRES_REVIEW',
}

describe('CustomerPaymentHistory', () => {
  it('shows a useful status without exposing internal identifiers', () => {
    render(<CustomerPaymentHistory payments={[pendingPayment]} />)

    expect(
      screen.getByText(
        'Giao dịch đang được xử lý. Bạn chưa cần thanh toán lại.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/#91|#42/)).not.toBeInTheDocument()
    expect(
      screen.queryByText('SAFE-MERCHANT-REFERENCE'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/đối soát|response|idempotency/i)).not.toBeInTheDocument()
  })

  it('uses a customer-facing label while a payment is being checked', () => {
    render(<CustomerPaymentHistory payments={[reviewPayment]} />)

    expect(screen.getByText('Đang kiểm tra')).toBeInTheDocument()
    expect(screen.queryByText('Cần đối soát')).not.toBeInTheDocument()
  })
})
