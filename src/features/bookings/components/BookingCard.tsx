import { Link } from 'react-router-dom'

import { Card } from '@/shared/components/Card'
import {
  formatDateOnly,
  formatMoney,
} from '@/shared/formatting/formatters'

import type { Booking } from '../types'
import {
  BookingHoldExpiryBadge,
  BookingPaymentStatusBadge,
  BookingStatusBadge,
} from './BookingStatusBadges'

interface BookingCardProps {
  booking: Booking
  to: string
}

export function BookingCard({ booking, to }: BookingCardProps) {
  return (
    <Card className="transition duration-fast ease-calm hover:border-brand/30 hover:shadow-elevation-3 motion-reduce:transition-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand">
            {booking.bookingCode}
          </p>
          <h2 className="mt-1 truncate text-lg font-bold text-ink">
            {booking.room.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Phòng {booking.room.roomNumber} · {booking.room.roomType.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={booking.status} />
          <BookingPaymentStatusBadge status={booking.paymentStatus} />
          <BookingHoldExpiryBadge
            paymentExpiresAt={booking.paymentExpiresAt}
            status={booking.status}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Nhận phòng</dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatDateOnly(booking.checkInDate)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Trả phòng</dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatDateOnly(booking.checkOutDate)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Số khách</dt>
          <dd className="mt-1 font-semibold text-ink">
            {booking.guestCount}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Tổng tiền</dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatMoney(booking.totalAmount)}
          </dd>
        </div>
      </dl>

      <Link
        className="mt-5 inline-flex text-sm font-bold text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        to={to}
      >
        Xem chi tiết
      </Link>
    </Card>
  )
}
