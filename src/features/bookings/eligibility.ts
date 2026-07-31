import type {
  Booking,
} from './types'

type BookingPaymentWindow = Pick<
  Booking,
  'paymentExpiresAt' | 'paymentStatus' | 'status'
>

export function isBookingPaymentWindowOpen(
  booking: BookingPaymentWindow,
  now = Date.now(),
) {
  if (
    booking.paymentStatus !== 'UNPAID' ||
    (booking.status !== 'PENDING_PAYMENT' &&
      booking.status !== 'CONFIRMED')
  ) {
    return false
  }

  if (booking.status === 'CONFIRMED') {
    return true
  }

  if (!booking.paymentExpiresAt) {
    return false
  }

  const expiresAt = Date.parse(booking.paymentExpiresAt)
  return Number.isFinite(expiresAt) && expiresAt > now
}
