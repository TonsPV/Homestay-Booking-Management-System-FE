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

export function BookingHoldExpiryBadge({
  now = Date.now(),
  paymentExpiresAt,
  status,
}: {
  now?: number
  paymentExpiresAt?: string | null
  status: BookingStatus
}) {
  if (status !== 'PENDING_PAYMENT' || !paymentExpiresAt) {
    return null
  }

  const expiresAt = Date.parse(paymentExpiresAt)
  if (!Number.isFinite(expiresAt)) {
    return null
  }

  const remaining = expiresAt - now

  if (remaining <= 0) {
    return <Badge tone="rose">Hết hạn giữ chỗ</Badge>
  }

  const totalMinutes = Math.ceil(remaining / 60_000)

  if (totalMinutes <= 15) {
    return (
      <Badge tone="rose">
        Giữ chỗ: còn {totalMinutes} phút
      </Badge>
    )
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const timeText =
    hours > 0
      ? `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`.trim()
      : `${minutes} phút`

  return (
    <Badge tone="amber">
      Giữ chỗ: còn {timeText}
    </Badge>
  )
}
