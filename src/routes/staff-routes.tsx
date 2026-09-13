import type { RouteObject } from 'react-router-dom'

export const staffRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { StaffIndexRoute } = await import('./StaffRouteAdapters')
      return { Component: StaffIndexRoute }
    },
  },
  {
    path: 'counter',
    lazy: async () => {
      const { CounterBookingPage } = await import('@/features/bookings')
      return { Component: CounterBookingPage }
    },
  },
  {
    path: 'rooms',
    lazy: async () => {
      const { ManagementRoomsRoute } = await import('./RoomRouteAdapters')
      return { Component: ManagementRoomsRoute }
    },
  },
  {
    path: 'rooms/:roomId',
    lazy: async () => {
      const { ManagementRoomDetailRoute } = await import('./RoomRouteAdapters')
      return { Component: ManagementRoomDetailRoute }
    },
  },
  {
    path: 'bookings',
    lazy: async () => {
      const { ManagementBookingsPage } = await import('@/features/bookings')
      return { Component: ManagementBookingsPage }
    },
  },
  {
    path: 'bookings/:bookingId',
    lazy: async () => {
      const { ManagementBookingDetailPage } =
        await import('@/features/bookings')
      return { Component: ManagementBookingDetailPage }
    },
  },
  {
    path: 'payments',
    lazy: async () => {
      const { StaffPaymentsPage } = await import('@/features/payments')
      return { Component: StaffPaymentsPage }
    },
  },
  {
    path: 'messages',
    lazy: async () => {
      const { ChatInboxPage } = await import('@/features/chat')
      return { Component: ChatInboxPage }
    },
  },
  {
    path: 'payments/:paymentId',
    lazy: async () => {
      const { StaffPaymentDetailRoute } = await import('./StaffRouteAdapters')
      return { Component: StaffPaymentDetailRoute }
    },
  },
]
