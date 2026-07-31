import type {
  BookingListQuery,
  ManagementBookingListQuery,
} from './types'

export const bookingKeys = {
  all: ['bookings'] as const,
  customer: () => [...bookingKeys.all, 'customer'] as const,
  customerList: (query: BookingListQuery) =>
    [...bookingKeys.customer(), 'list', query] as const,
  customerDetail: (id: string) =>
    [...bookingKeys.customer(), 'detail', id] as const,
  management: () => [...bookingKeys.all, 'management'] as const,
  managementList: (query: ManagementBookingListQuery) =>
    [...bookingKeys.management(), 'list', query] as const,
  managementDetail: (id: string) =>
    [...bookingKeys.management(), 'detail', id] as const,
}
