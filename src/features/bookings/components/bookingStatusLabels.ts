import type { BookingStatus } from '../types'

const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  CHECKED_OUT: 'Đã trả phòng',
  CANCELLED: 'Đã hủy',
}

export function getBookingStatusLabel(status: BookingStatus) {
  return bookingStatusLabels[status]
}

