import type {
  BookingListQuery,
  ManagementBookingListQuery,
} from './types'

export const bookingKeys = {
  all: ['bookings'] as const,
  customer: () => [...bookingKeys.all, 'customer'] as const,
  customerLists: () => [...bookingKeys.customer(), 'list'] as const,
  customerList: (query: BookingListQuery) =>
    [...bookingKeys.customerLists(), query] as const,
  customerDetail: (id: string) =>
    [...bookingKeys.customer(), 'detail', id] as const,
  management: () => [...bookingKeys.all, 'management'] as const,
  managementLists: () => [...bookingKeys.management(), 'list'] as const,
  managementList: (query: ManagementBookingListQuery) =>
    [...bookingKeys.managementLists(), query] as const,
  managementDetail: (id: string) =>
    [...bookingKeys.management(), 'detail', id] as const,
}
