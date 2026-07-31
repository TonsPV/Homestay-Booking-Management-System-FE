import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  isBookingPaymentWindowOpen,
} from './eligibility'

describe('isBookingPaymentWindowOpen', () => {
  const now = Date.parse('2026-08-01T00:00:00.000Z')

  it('allows a pending booking only before its server deadline', () => {
    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: '2026-08-01T00:01:00.000Z',
          paymentStatus: 'UNPAID',
          status: 'PENDING_PAYMENT',
        },
        now,
      ),
    ).toBe(true)

    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: '2026-08-01T00:00:00.000Z',
          paymentStatus: 'UNPAID',
          status: 'PENDING_PAYMENT',
        },
        now,
      ),
    ).toBe(false)
  })

  it('allows an unpaid confirmed counter booking without a booking deadline', () => {
    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: null,
          paymentStatus: 'UNPAID',
          status: 'CONFIRMED',
        },
        now,
      ),
    ).toBe(true)
  })

  it('rejects paid, refunded, cancelled, and malformed windows', () => {
    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: 'invalid',
          paymentStatus: 'UNPAID',
          status: 'PENDING_PAYMENT',
        },
        now,
      ),
    ).toBe(false)
    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: null,
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
        now,
      ),
    ).toBe(false)
    expect(
      isBookingPaymentWindowOpen(
        {
          paymentExpiresAt: null,
          paymentStatus: 'UNPAID',
          status: 'CANCELLED',
        },
        now,
      ),
    ).toBe(false)
  })
})
