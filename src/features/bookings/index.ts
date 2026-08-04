export {
  CustomerBookingListPage as CustomerBookingsPage,
} from './pages/CustomerBookingListPage'
export { CustomerBookingDetailPage } from './pages/CustomerBookingDetailPage'
export { CreateBookingPage } from './pages/CreateBookingPage'
export { ManagementBookingsPage } from './pages/ManagementBookingsPage'
export { ManagementBookingDetailPage } from './pages/ManagementBookingDetailPage'
export { CounterBookingPage } from './pages/CounterBookingPage'

export {
  useCustomerBooking,
  useCustomerBookings,
  useManagementBooking,
  useManagementBookings,
} from './hooks'
export type {
  Booking,
  BookingPaymentStatus,
  BookingStatus,
  CreateBookingInput,
  CreateManagementBookingInput,
} from './types'

