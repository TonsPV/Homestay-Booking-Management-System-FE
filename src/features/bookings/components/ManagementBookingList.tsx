import { Link } from 'react-router-dom'

import {
  formatDateOnly,
  formatMoney,
} from '@/shared/formatting/formatters'

import type { Booking } from '../types'
import { BookingCard } from './BookingCard'
import {
  BookingPaymentStatusBadge,
  BookingStatusBadge,
} from './BookingStatusBadges'

export function ManagementBookingList({
  bookings,
}: {
  bookings: Booking[]
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-panel border border-line bg-surface shadow-card lg:block">
        <table className="w-full min-w-[70rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Danh sách booking dành cho nhân viên quản lý
          </caption>
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3" scope="col">
                Booking
              </th>
              <th className="px-4 py-3" scope="col">
                Khách hàng
              </th>
              <th className="px-4 py-3" scope="col">
                Phòng
              </th>
              <th className="px-4 py-3" scope="col">
                Lưu trú
              </th>
              <th className="px-4 py-3" scope="col">
                Tổng tiền
              </th>
              <th className="px-4 py-3" scope="col">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right" scope="col">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bookings.map((booking) => (
              <tr className="align-top hover:bg-surface-muted" key={booking.id}>
                <th className="px-4 py-3" scope="row">
                  <Link
                    className="font-bold text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    to={booking.id}
                  >
                    {booking.bookingCode}
                  </Link>
                  <p className="mt-1 font-normal text-muted">
                    {booking.guestCount} khách
                  </p>
                </th>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {booking.contactName}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {booking.contactPhone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {booking.room.roomNumber}
                  </p>
                  <p className="mt-1 max-w-52 text-xs text-muted">
                    {booking.room.name} · {booking.room.roomType.name}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink">
                  <p>{formatDateOnly(booking.checkInDate)}</p>
                  <p className="mt-1 text-xs text-muted">
                    đến {formatDateOnly(booking.checkOutDate)}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                  {formatMoney(booking.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-52 flex-wrap gap-2">
                    <BookingStatusBadge status={booking.status} />
                    <BookingPaymentStatusBadge
                      status={booking.paymentStatus}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    aria-label={`Xem chi tiết booking ${booking.bookingCode}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    to={booking.id}
                  >
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-4 lg:hidden">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <BookingCard booking={booking} to={booking.id} />
          </li>
        ))}
      </ul>
    </>
  )
}
