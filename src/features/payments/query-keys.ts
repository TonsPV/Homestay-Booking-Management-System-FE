import type { PaymentListQuery } from './types'

export const paymentKeys = {
  all: ['payments'] as const,
  customer: (bookingId: string) =>
    [...paymentKeys.all, 'customer', bookingId] as const,
  customerList: (bookingId: string, query: PaymentListQuery) =>
    [...paymentKeys.customer(bookingId), 'list', query] as const,
  management: () => [...paymentKeys.all, 'management'] as const,
  managementList: (query: PaymentListQuery) =>
    [...paymentKeys.management(), 'list', query] as const,
  managementBooking: (bookingId: string, query: PaymentListQuery) =>
    [...paymentKeys.management(), 'booking', bookingId, query] as const,
  managementDetail: (paymentId: string) =>
    [...paymentKeys.management(), 'detail', paymentId] as const,
  vnPayReturn: (search: string) =>
    [...paymentKeys.all, 'vnpay-return', search] as const,
}
