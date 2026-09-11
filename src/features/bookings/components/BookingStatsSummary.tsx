import { Link } from 'react-router-dom'

import { Card } from '@/shared/components/Card'
import { Skeleton } from '@/shared/components/Skeleton'
import { formatMoney } from '@/shared/formatting/formatters'

import { sumBookingAmounts } from './booking-amounts'
import type { Booking } from '../types'

interface BookingStatsSummaryProps {
  bookings: Booking[]
  loading: boolean
}

export function BookingStatsSummary({
  bookings,
  loading,
}: BookingStatsSummaryProps) {
  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Skeleton className="min-h-24" variant="line" />
        <Skeleton className="min-h-24" variant="line" />
        <Skeleton className="min-h-24" variant="line" />
        <Skeleton className="min-h-24" variant="line" />
      </div>
    )
  }

  const pendingPaymentCount = bookings.filter(
    (booking) => booking.status === 'PENDING_PAYMENT',
  ).length
  const confirmedCount = bookings.filter(
    (booking) => booking.status === 'CONFIRMED',
  ).length
  const displayedTotal = sumBookingAmounts(
    bookings.filter((booking) => booking.status !== 'CANCELLED'),
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Đơn chờ xử lý
        </p>
        <p
          className="mt-1 text-2xl font-bold text-ink"
          data-testid="stat-pending-payment"
        >
          {pendingPaymentCount}
        </p>
        <p className="mt-1 text-xs text-muted">
          Đơn đang chờ thanh toán trong trang này
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Đơn đã xác nhận
        </p>
        <p
          className="mt-1 text-2xl font-bold text-ink"
          data-testid="stat-confirmed"
        >
          {confirmedCount}
        </p>
        <p className="mt-1 text-xs text-muted">
          Đơn đã được xác nhận trong trang này
        </p>
      </Card>

      <Card className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Tổng tiền đơn chưa hủy
        </p>
        <p
          className="mt-1 text-2xl font-bold text-ink"
          data-testid="stat-displayed-total"
        >
          {formatMoney(displayedTotal)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Tổng tiền của các đơn chưa hủy trong trang này
        </p>
      </Card>

      <Card className="flex flex-col justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Lối tắt
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Thanh toán và đối soát
          </p>
        </div>
        <Link
          className="inline-flex min-h-9 w-fit items-center justify-center rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-elevation-1 transition duration-fast ease-calm hover:border-muted/60 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
          to="/management/payments"
        >
          Quản lý thanh toán →
        </Link>
      </Card>
    </div>
  )
}
