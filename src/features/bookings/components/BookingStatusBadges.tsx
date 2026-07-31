import { Badge } from '@/shared/components/Badge'

import type {
  BookingPaymentStatus,
  BookingStatus,
} from '../types'
import { getBookingStatusLabel } from './bookingStatusLabels'

const bookingStatusTones: Record<
  BookingStatus,
  'amber' | 'blue' | 'emerald' | 'rose' | 'slate'
> = {
  PENDING_PAYMENT: 'amber',
  CONFIRMED: 'blue',
  CHECKED_IN: 'emerald',
  CHECKED_OUT: 'slate',
  CANCELLED: 'rose',
}

const paymentStatusLabels: Record<BookingPaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
}

const paymentStatusTones: Record<
  BookingPaymentStatus,
  'amber' | 'emerald' | 'violet'
> = {
  UNPAID: 'amber',
  PAID: 'emerald',
  REFUNDED: 'violet',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge tone={bookingStatusTones[status]}>
      {getBookingStatusLabel(status)}
    </Badge>
  )
}

export function BookingPaymentStatusBadge({
  status,
}: {
  status: BookingPaymentStatus
}) {
  return (
    <Badge tone={paymentStatusTones[status]}>
      {paymentStatusLabels[status]}
    </Badge>
  )
}
