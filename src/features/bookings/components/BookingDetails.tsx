import { Card } from '@/shared/components/Card'
import {
  formatDateOnly,
  formatDateTime,
  formatMoney,
} from '@/shared/formatting/formatters'

import type { Booking } from '../types'
import {
  BookingPaymentStatusBadge,
  BookingStatusBadge,
} from './BookingStatusBadges'

function DetailItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

export function BookingDetails({ booking }: { booking: Booking }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">
              {booking.bookingCode}
            </p>
            <h2 className="mt-1 text-xl font-black text-ink">
              {booking.room.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Phòng {booking.room.roomNumber} · {booking.room.roomType.name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.status} />
            <BookingPaymentStatusBadge status={booking.paymentStatus} />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-line pt-5 sm:grid-cols-3">
          <DetailItem
            label="Nhận phòng"
            value={formatDateOnly(booking.checkInDate)}
          />
          <DetailItem
            label="Trả phòng"
            value={formatDateOnly(booking.checkOutDate)}
          />
          <DetailItem label="Số khách" value={booking.guestCount} />
          <DetailItem
            label="Tổng tiền"
            value={formatMoney(booking.totalAmount)}
          />
          <DetailItem
            label="Hạn thanh toán"
            value={formatDateTime(booking.paymentExpiresAt)}
          />
          <DetailItem
            label="Ngày tạo"
            value={formatDateTime(booking.createdAt)}
          />
        </dl>

        {booking.customerNote ? (
          <div className="mt-6 rounded-card bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Ghi chú
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-body text-ink">
              {booking.customerNote}
            </p>
          </div>
        ) : null}

        {booking.cancellationReason ? (
          <div className="mt-4 rounded-card border border-danger/20 bg-danger-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-danger-strong">
              Lý do hủy
            </p>
            <p className="mt-2 text-sm text-danger-strong">
              {booking.cancellationReason}
            </p>
          </div>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-base font-bold text-ink">
          Thông tin liên hệ
        </h2>
        <dl className="mt-5 grid gap-5">
          <DetailItem label="Khách hàng" value={booking.contactName} />
          <DetailItem label="Điện thoại" value={booking.contactPhone} />
          <DetailItem label="Email" value={booking.contactEmail ?? '—'} />
          <DetailItem
            label="Người tạo"
            value={booking.createdByUser?.fullName ?? 'Khách hàng trực tuyến'}
          />
        </dl>
      </Card>
    </div>
  )
}
