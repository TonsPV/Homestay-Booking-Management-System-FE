import { Navigate, type RouteObject } from 'react-router-dom'

import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { RouteGuard } from './RouteGuard'

export const publicRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { HomePage } = await import('@/features/home/pages/HomePage')
      return { Component: HomePage }
    },
  },
  {
    path: 'room-types',
    lazy: async () => {
      const { PublicRoomTypesRoute } = await import('./RoomTypeRouteAdapters')
      return { Component: PublicRoomTypesRoute }
    },
  },
  {
    path: 'room-types/:roomTypeId',
    lazy: async () => {
      const { PublicRoomTypeDetailRoute } = await import(
        './RoomTypeRouteAdapters'
      )
      return { Component: PublicRoomTypeDetailRoute }
    },
  },
  {
    path: 'rooms',
    lazy: async () => {
      const { PublicRoomsRoute } = await import('./RoomRouteAdapters')
      return { Component: PublicRoomsRoute }
    },
  },
  {
    path: 'rooms/search',
    lazy: async () => {
      const { RoomSearchRoute } = await import('./RoomRouteAdapters')
      return { Component: RoomSearchRoute }
    },
  },
  {
    path: 'rooms/:roomId',
    lazy: async () => {
      const { PublicRoomDetailRoute } = await import('./RoomRouteAdapters')
      return { Component: PublicRoomDetailRoute }
    },
  },
  {
    path: 'payments/vnpay/return',
    lazy: async () => {
      const { VnPayReturnPage } = await import('@/features/payments')
      return { Component: VnPayReturnPage }
    },
  },
  {
    element: <RouteGuard actor="customer" loginPath="/login" />,
    children: [
      {
        path: 'account',
        lazy: async () => {
          const { CustomerProfilePage } = await import('@/features/customers')
          return { Component: CustomerProfilePage }
        },
      },
      {
        path: 'bookings',
        lazy: async () => {
          const { CustomerBookingsPage } = await import('@/features/bookings')
          return { Component: CustomerBookingsPage }
        },
      },
      {
        path: 'bookings/new/:roomId',
        lazy: async () => {
          const { CreateBookingPage } = await import('@/features/bookings')
          return { Component: CreateBookingPage }
        },
      },
      {
        path: 'bookings/:bookingId',
        lazy: async () => {
          const { CustomerBookingDetailPage } = await import(
            '@/features/bookings'
          )
          return { Component: CustomerBookingDetailPage }
        },
      },
      {
        path: 'messages',
        element: <Navigate replace to="/bookings" />,
      },
    ],
  },
  {
    element: <ForbiddenPage />,
    path: 'forbidden',
  },
  {
    element: <NotFoundPage />,
    path: '*',
  },
]
