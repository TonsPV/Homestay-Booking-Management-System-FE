import type {
  BookingCancelData,
  BookingCreateData,
  BookingDto,
  ManagementBookingDto,
  BookingListData,
  BookingManagementCreateData,
  BookingManagementListData,
  BookingManagementUpdateStatusData,
  BookingPaymentStatus as GeneratedBookingPaymentStatus,
  BookingStatus as GeneratedBookingStatus,
} from "@/api/generated";

export const BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
] as const satisfies readonly GeneratedBookingStatus[];

export type BookingStatus = GeneratedBookingStatus;

export const BOOKING_PAYMENT_STATUSES = [
  "UNPAID",
  "PAID",
  "REFUNDED",
] as const satisfies readonly GeneratedBookingPaymentStatus[];

export type BookingPaymentStatus = GeneratedBookingPaymentStatus;
export type Booking = BookingDto;
export type ManagementBooking = ManagementBookingDto;

export type CreateBookingInput = BookingCreateData["body"];
export type CreateManagementBookingInput = BookingManagementCreateData["body"];
export type CancelBookingInput = BookingCancelData["body"];
export type UpdateBookingStatusInput =
  BookingManagementUpdateStatusData["body"];
export type BookingListQuery = NonNullable<BookingListData["query"]>;
export type ManagementBookingListQuery = NonNullable<
  BookingManagementListData["query"]
>;
