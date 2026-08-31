import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { ApiError } from '@/api/errors'
import type { AuthPrincipal } from '@/auth/types'
import { useAuth } from '@/auth/useAuth'
import { dashboardKeys } from '@/features/dashboard/query-keys'
import { paymentKeys } from '@/features/payments/query-keys'
import { roomKeys } from '@/features/rooms/query-keys'

import { bookingApi } from './api'
import {
  clearBookingIntent,
  getOrCreateBookingIntentKey,
  quarantineBookingIntent,
} from './idempotency'
import { bookingKeys } from './query-keys'
import type { BookingListQuery, ManagementBookingListQuery } from './types'

export { bookingKeys } from './query-keys'

export type BookingReconciliationState =
  | 'idle'
  | 'reconciling'
  | 'authoritative'
  | 'unknown'

function requireActorId(
  principal: AuthPrincipal | null,
  actorType: AuthPrincipal['actorType'],
) {
  if (principal?.actorType !== actorType) {
    throw new Error(`Authenticated ${actorType} actor is required.`)
  }

  return principal.id
}

function settleSecondaryRefreshes(refreshes: Promise<unknown>[]) {
  void Promise.allSettled(refreshes)
}

function isRequestIntentConflict(error: unknown) {
  return (
    error instanceof ApiError &&
    error.errorCode === 'BOOKING_REQUEST_INTENT_CONFLICT'
  )
}

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
  const { principal } = useAuth()
  const actorId =
    principal?.actorType === 'customer' ? principal.id : undefined

  return useMutation({
    mutationFn: (input: Parameters<typeof bookingApi.createCustomer>[0]) => {
      const currentActorId = requireActorId(principal, 'customer')

      return bookingApi.createCustomer(
        input,
        getOrCreateBookingIntentKey('customer', currentActorId, input),
      )
    },
    onSuccess: (booking, input) => {
      if (actorId !== undefined) {
        clearBookingIntent('customer', actorId, input)
      }
      queryClient.setQueryData(
        bookingKeys.customerDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: async (error, input) => {
      if (isRequestIntentConflict(error) && actorId !== undefined) {
        quarantineBookingIntent('customer', actorId, input)
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.customer(),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        }),
        ...(error instanceof ApiError && error.isStatus(409)
          ? [
              queryClient.invalidateQueries({
                queryKey: dashboardKeys.all,
                refetchType: 'all',
              }),
            ]
          : []),
      ])
    },
  })
}

export function useCancelCustomerBooking() {
  const queryClient = useQueryClient()
  const [reconciliationState, setReconciliationState] =
    useState<BookingReconciliationState>('idle')

  const refreshSecondaryState = useCallback(
    (id: string) => {
      settleSecondaryRefreshes([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.customerLists(),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: paymentKeys.customer(id),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          refetchType: 'all',
        }),
      ])
    },
    [queryClient],
  )

  const retryReconciliation = useCallback(
    async (id: string) => {
      setReconciliationState('reconciling')

      try {
        await queryClient.fetchQuery({
          queryKey: bookingKeys.customerDetail(id),
          queryFn: ({ signal }) => bookingApi.getCustomer(id, signal),
          staleTime: 0,
        })
        setReconciliationState('authoritative')
        refreshSecondaryState(id)
        return true
      } catch {
        setReconciliationState('unknown')
        refreshSecondaryState(id)
        return false
      }
    },
    [queryClient, refreshSecondaryState],
  )

  const mutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof bookingApi.cancelCustomer>[1]
    }) => bookingApi.cancelCustomer(id, input),
    onSuccess: (booking) => {
      setReconciliationState('authoritative')
      queryClient.setQueryData(
        bookingKeys.customerDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: async (_error, variables) => {
      // The server may have committed the cancellation before the response
      // was lost. Re-read authoritative state before the UI offers retry.
      await retryReconciliation(variables.id)
    },
  })

  return {
    ...mutation,
    isReconciling: reconciliationState === 'reconciling',
    isStateUnknown: reconciliationState === 'unknown',
    reconciliationState,
    retryReconciliation,
  }
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
  const { principal } = useAuth()
  const actorId = principal?.actorType === 'user' ? principal.id : undefined

  return useMutation({
    mutationFn: (input: Parameters<typeof bookingApi.createManagement>[0]) => {
      const currentActorId = requireActorId(principal, 'user')

      return bookingApi.createManagement(
        input,
        getOrCreateBookingIntentKey('management', currentActorId, input),
      )
    },
    onSuccess: (booking, input) => {
      if (actorId !== undefined) {
        clearBookingIntent('management', actorId, input)
      }
      queryClient.setQueryData(
        bookingKeys.managementDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.management() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: async (error, input) => {
      if (isRequestIntentConflict(error) && actorId !== undefined) {
        quarantineBookingIntent('management', actorId, input)
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: bookingKeys.management(),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: roomKeys.all,
          refetchType: 'all',
        }),
        ...(error instanceof ApiError && error.isStatus(409)
          ? [
              queryClient.invalidateQueries({
                queryKey: dashboardKeys.all,
                refetchType: 'all',
              }),
            ]
          : []),
      ])
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  const [reconciliationState, setReconciliationState] =
    useState<BookingReconciliationState>('idle')

  const refreshSecondaryState = useCallback(() => {
    settleSecondaryRefreshes([
      queryClient.invalidateQueries({
        queryKey: bookingKeys.managementLists(),
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: bookingKeys.customerLists(),
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: paymentKeys.management(),
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: roomKeys.all,
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.all,
        refetchType: 'all',
      }),
    ])
  }, [queryClient])

  const retryReconciliation = useCallback(
    async (id: string) => {
      setReconciliationState('reconciling')

      try {
        await queryClient.fetchQuery({
          queryKey: bookingKeys.managementDetail(id),
          queryFn: ({ signal }) => bookingApi.getManagement(id, signal),
          staleTime: 0,
        })
        setReconciliationState('authoritative')
        refreshSecondaryState()
        return true
      } catch {
        setReconciliationState('unknown')
        refreshSecondaryState()
        return false
      }
    },
    [queryClient, refreshSecondaryState],
  )

  const mutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof bookingApi.updateStatus>[1]
    }) => bookingApi.updateStatus(id, input),
    onSuccess: (booking) => {
      setReconciliationState('authoritative')
      queryClient.setQueryData(
        bookingKeys.managementDetail(booking.id),
        booking,
      )
      void queryClient.invalidateQueries({ queryKey: bookingKeys.management() })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.customer() })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
    onError: async (_error, variables) => {
      // A transition can commit even when the client sees a timeout/5xx.
      // The detail query alone gates subsequent actions; secondary refreshes
      // cannot turn an authoritative detail success into a failed recovery.
      await retryReconciliation(variables.id)
    },
  })

  return {
    ...mutation,
    isReconciling: reconciliationState === 'reconciling',
    isStateUnknown: reconciliationState === 'unknown',
    reconciliationState,
    retryReconciliation,
  }
}
