import { createBrowserRouter } from 'react-router-dom'

import { AuthLayout } from '@/layouts/AuthLayout'
import { ManagementLayout } from '@/layouts/ManagementLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { HomePage } from '@/pages/HomePage'
import { ManagementDashboardPage } from '@/pages/ManagementDashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

import { RouteGuard } from './RouteGuard'
import { RouteLoading } from './RouteSupport'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    HydrateFallback: RouteLoading,
    path: '/',
    children: [
      {
        element: <HomePage />,
        index: true,
      },
      {
        path: 'room-types',
        lazy: async () => {
          const { PublicRoomTypesRoute } = await import(
            './RoomTypeRouteAdapters'
          )
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
              const { CustomerProfilePage } = await import(
                '@/features/customers'
              )
              return { Component: CustomerProfilePage }
            },
          },
          {
            path: 'bookings',
            lazy: async () => {
              const { CustomerBookingsPage } = await import(
                '@/features/bookings'
              )
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
    ],
  },
  {
    element: <AuthLayout />,
    HydrateFallback: RouteLoading,
    children: [
      {
        path: 'login',
        lazy: async () => {
          const { CustomerLoginRoute } = await import('./AuthRouteAdapters')
          return { Component: CustomerLoginRoute }
        },
      },
      {
        path: 'register',
        lazy: async () => {
          const { RegisterRoute } = await import('./AuthRouteAdapters')
          return { Component: RegisterRoute }
        },
      },
      {
        path: 'management/login',
        lazy: async () => {
          const { ManagementLoginRoute } = await import('./AuthRouteAdapters')
          return { Component: ManagementLoginRoute }
        },
      },
    ],
  },
  {
    element: (
      <RouteGuard
        actor="user"
        loginPath="/management/login"
        roles={['ADMIN', 'STAFF']}
      />
    ),
    HydrateFallback: RouteLoading,
    children: [
      {
        element: <ManagementLayout />,
        path: 'management',
        children: [
          {
            element: <ManagementDashboardPage />,
            index: true,
          },
          {
            path: 'rooms',
            lazy: async () => {
              const { ManagementRoomsRoute } = await import(
                './RoomRouteAdapters'
              )
              return { Component: ManagementRoomsRoute }
            },
          },
          {
            path: 'rooms/:roomId',
            lazy: async () => {
              const { ManagementRoomDetailRoute } = await import(
                './RoomRouteAdapters'
              )
              return { Component: ManagementRoomDetailRoute }
            },
          },
          {
            path: 'bookings',
            lazy: async () => {
              const { ManagementBookingsPage } = await import(
                '@/features/bookings'
              )
              return { Component: ManagementBookingsPage }
            },
          },
          {
            path: 'bookings/new',
            lazy: async () => {
              const { ManagementCreateBookingPage } = await import(
                '@/features/bookings'
              )
              return { Component: ManagementCreateBookingPage }
            },
          },
          {
            path: 'bookings/:bookingId',
            lazy: async () => {
              const { ManagementBookingDetailPage } = await import(
                '@/features/bookings'
              )
              return { Component: ManagementBookingDetailPage }
            },
          },
          {
            path: 'payments',
            lazy: async () => {
              const { ManagementPaymentsPage } = await import(
                '@/features/payments'
              )
              return { Component: ManagementPaymentsPage }
            },
          },
          {
            element: (
              <RouteGuard
                actor="user"
                loginPath="/management/login"
                roles={['ADMIN']}
              />
            ),
            children: [
              {
                path: 'room-types',
                lazy: async () => {
                  const { ManagementRoomTypesPage } = await import(
                    '@/features/room-types/pages/RoomTypeManagementPage'
                  )
                  return { Component: ManagementRoomTypesPage }
                },
              },
              {
                path: 'amenities',
                lazy: async () => {
                  const { AmenityManagementPage } = await import(
                    '@/features/amenities'
                  )
                  return { Component: AmenityManagementPage }
                },
              },
              {
                path: 'users',
                lazy: async () => {
                  const { UserAdminPage } = await import('@/features/users')
                  return { Component: UserAdminPage }
                },
              },
              {
                path: 'customers',
                lazy: async () => {
                  const { CustomerAdminPage } = await import(
                    '@/features/customers'
                  )
                  return { Component: CustomerAdminPage }
                },
              },
            ],
          },
        ],
      },
    ],
  },
])
