import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiError } from '@/api/errors'
import { dashboardKeys } from '@/features/dashboard/query-keys'
import { paymentKeys } from '@/features/payments/query-keys'
import { roomKeys } from '@/features/rooms/query-keys'

import { bookingApi } from './api'
import { bookingKeys } from './query-keys'
import type { BookingListQuery, ManagementBookingListQuery } from './types'

export { bookingKeys } from './query-keys'

export function useCustomerBookings(query: BookingListQuery) {
  return useQuery({
    queryKey: bookingKeys.customerList(query),
    queryFn: ({ signal }) => bookingApi.listCustomer(query, signal),
  })
}

export function useCustomerBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.customerDetail(id ?? 'missing'),
    queryFn: ({ signal }) => bookingApi.getCustomer(id ?? '', signal),
    enabled: Boolean(id),
  })
}

export function useCreateCustomerBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bookingApi.createCustomer,
    onSuccess: (booking) => {
      queryClient.setQueryData(
        bookingKeys.customerDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isStatus(409)) {
        void queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          refetchType: 'all',
        })
      }
    },
  })
}

export function useCancelCustomerBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof bookingApi.cancelCustomer>[1]
    }) => bookingApi.cancelCustomer(id, input),
    onSuccess: (booking) => {
      queryClient.setQueryData(
        bookingKeys.customerDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.isStatus(409)) {
        void queryClient.invalidateQueries({
          queryKey: bookingKeys.customerDetail(variables.id),
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: paymentKeys.customer(variables.id),
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          refetchType: 'all',
        })
      }
    },
  })
}

export function useManagementBookings(query: ManagementBookingListQuery) {
  return useQuery({
    queryKey: bookingKeys.managementList(query),
    queryFn: ({ signal }) => bookingApi.listManagement(query, signal),
  })
}

export function useManagementBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.managementDetail(id ?? 'missing'),
    queryFn: ({ signal }) => bookingApi.getManagement(id ?? '', signal),
    enabled: Boolean(id),
  })
}

export function useCreateManagementBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bookingApi.createManagement,
    onSuccess: (booking) => {
      queryClient.setQueryData(
        bookingKeys.managementDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.management() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isStatus(409)) {
        void queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          refetchType: 'all',
        })
      }
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof bookingApi.updateStatus>[1]
    }) => bookingApi.updateStatus(id, input),
    onSuccess: (booking) => {
      queryClient.setQueryData(
        bookingKeys.managementDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.management() })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.isStatus(409)) {
        void queryClient.invalidateQueries({
          queryKey: bookingKeys.managementDetail(variables.id),
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: paymentKeys.management(),
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        })
        void queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          refetchType: 'all',
        })
      }
    },
  })
}
