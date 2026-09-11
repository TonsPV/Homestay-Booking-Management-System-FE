import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  BookingHoldExpiryBadge,
  BookingPaymentStatusBadge,
  BookingStatusBadge,
} from './BookingStatusBadges'

describe('BookingStatusBadges', () => {
  it('renders booking status and payment status correctly', () => {
    render(
      <>
        <BookingStatusBadge status="PENDING_PAYMENT" />
        <BookingPaymentStatusBadge status="UNPAID" />
      </>,
    )

    expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument()
    expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument()
  })

  describe('BookingHoldExpiryBadge', () => {
    const baseNow = new Date('2026-07-29T10:00:00.000Z').getTime()

    it('returns null if status is not PENDING_PAYMENT', () => {
      const { container } = render(
        <BookingHoldExpiryBadge
          now={baseNow}
          paymentExpiresAt="2026-07-29T10:10:00.000Z"
          status="CONFIRMED"
        />,
      )

      expect(container).toBeEmptyDOMElement()
    })

    it('returns null if paymentExpiresAt is null or undefined', () => {
      const { container } = render(
        <BookingHoldExpiryBadge
          now={baseNow}
          paymentExpiresAt={null}
          status="PENDING_PAYMENT"
        />,
      )

      expect(container).toBeEmptyDOMElement()
    })

    it('renders expired badge when payment deadline has passed', () => {
      render(
        <BookingHoldExpiryBadge
          now={baseNow}
          paymentExpiresAt="2026-07-29T09:59:00.000Z"
          status="PENDING_PAYMENT"
        />,
      )

      const badge = screen.getByText('Hết hạn giữ chỗ')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-danger-soft')
    })

    it('renders urgent rose badge when remaining time <= 15 minutes', () => {
      // 10 minutes remaining
      render(
        <BookingHoldExpiryBadge
          now={baseNow}
          paymentExpiresAt="2026-07-29T10:10:00.000Z"
          status="PENDING_PAYMENT"
        />,
      )

      const badge = screen.getByText('Giữ chỗ: còn 10 phút')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-danger-soft')
    })

    it('renders warning amber badge when remaining time > 15 minutes', () => {
      // 1 hour 30 minutes remaining
      render(
        <BookingHoldExpiryBadge
          now={baseNow}
          paymentExpiresAt="2026-07-29T11:30:00.000Z"
          status="PENDING_PAYMENT"
        />,
      )

      const badge = screen.getByText('Giữ chỗ: còn 1 giờ 30 phút')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-warning-soft')
    })
  })
})
