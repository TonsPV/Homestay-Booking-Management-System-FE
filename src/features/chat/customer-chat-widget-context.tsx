import {
  createContext,
  useContext,
} from 'react'

export interface CustomerChatWidgetContextValue {
  close: () => void
  isMinimized: boolean
  isOpen: boolean
  minimize: () => void
  openBooking: (bookingId: string) => void
  openInbox: () => void
  selectedBookingId: string | null
}

const inactiveContext: CustomerChatWidgetContextValue = {
  close: () => undefined,
  isMinimized: false,
  isOpen: false,
  minimize: () => undefined,
  openBooking: () => undefined,
  openInbox: () => undefined,
  selectedBookingId: null,
}

export const CustomerChatWidgetContext =
  createContext<CustomerChatWidgetContextValue>(inactiveContext)

export function useCustomerChatWidget() {
  return useContext(CustomerChatWidgetContext)
}
