import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { ApiError } from '@/api/errors'
import { bookingKeys } from '@/features/bookings/query-keys'
import { dashboardKeys } from '@/features/dashboard/query-keys'
import { roomKeys } from '@/features/rooms/query-keys'

import { paymentApi } from './api'
import { paymentKeys } from './query-keys'
import { getBoundedPaymentPollingInterval } from './safety'
import type { Payment, PaymentListQuery } from './types'

export { paymentKeys } from './query-keys'

interface CustomerPaymentPolling {
  deadline: number | null
  enabled?: boolean
  paymentId: string
}

export function useCustomerPayments(
  bookingId: string | undefined,
  query: PaymentListQuery = { limit: 20, page: 1 },
  polling?: CustomerPaymentPolling,
) {
  return useQuery({
    queryKey: paymentKeys.customerList(bookingId ?? 'missing', query),
    queryFn: ({ signal }) =>
      paymentApi.listCustomer(bookingId ?? '', query, signal),
    enabled: Boolean(bookingId) && (polling?.enabled ?? true),
    refetchInterval: (paymentQuery) => {
      if (!polling) {
        return false
      }

      const payment = paymentQuery.state.data?.data.find(
        (item) => item.id === polling.paymentId,
      )

      return getBoundedPaymentPollingInterval(
        polling.deadline,
        payment?.status,
      )
    },
    refetchIntervalInBackground: Boolean(polling?.deadline),
  })
}

export function useCreateVnPayPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      bookingId,
      idempotencyKey,
      input,
    }: {
      bookingId: string
      idempotencyKey: string
      input: Parameters<typeof paymentApi.createVnPay>[2]
    }) => paymentApi.createVnPay(bookingId, idempotencyKey, input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.customer(result.payment.bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
    },
    onError: (error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.customer(variables.bookingId),
      })

      if (error instanceof ApiError && error.isStatus(409)) {
        void queryClient.invalidateQueries({
          queryKey: bookingKeys.all,
          refetchType: 'all',
        })
      }
    },
  })
}

export function useManagementPayments(
  query: PaymentListQuery = { limit: 20, page: 1 },
) {
  return useQuery({
    queryKey: paymentKeys.managementList(query),
    queryFn: ({ signal }) => paymentApi.listManagement(query, signal),
  })
}

export function useManagementPayment(paymentId: string | undefined) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: paymentKeys.managementDetail(paymentId ?? 'missing'),
    queryFn: async ({ signal }) => {
      if (!paymentId) {
        throw new Error('Payment ID is required')
      }

      const cached = queryClient
        .getQueriesData<{ data: Payment[] }>({ queryKey: paymentKeys.all })
        .flatMap(([, data]) => data?.data ?? [])
        .find((item) => item.id === paymentId)

      if (cached) {
        return cached
      }

      const response = await paymentApi.listManagement(
        { limit: 50, page: 1 },
        signal,
      )
      const found = response.data.find((item) => item.id === paymentId)

      if (found) {
        return found
      }

      throw new ApiError('Không tìm thấy giao dịch thanh toán.', {
        kind: 'http',
        status: 404,
      })
    },
    enabled: Boolean(paymentId),
    initialData: () => {
      if (!paymentId) {
        return undefined
      }

      return queryClient
        .getQueriesData<{ data: Payment[] }>({ queryKey: paymentKeys.all })
        .flatMap(([, data]) => data?.data ?? [])
        .find((item) => item.id === paymentId)
    },
  })
}

export function useManagementBookingPayments(
  bookingId: string | undefined,
  query: PaymentListQuery = { limit: 20, page: 1 },
) {
  return useQuery({
    queryKey: paymentKeys.managementBooking(
      bookingId ?? 'missing',
      query,
    ),
    queryFn: ({ signal }) =>
      paymentApi.listManagementBooking(bookingId ?? '', query, signal),
    enabled: Boolean(bookingId),
  })
}

export function useCreateManualPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      bookingId,
      idempotencyKey,
      input,
    }: {
      bookingId: string
      idempotencyKey: string
      input: Parameters<typeof paymentApi.createManual>[2]
    }) => paymentApi.createManual(bookingId, idempotencyKey, input),
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.management(),
      })
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.customer(variables.bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentId,
      idempotencyKey,
      input,
    }: {
      paymentId: string
      idempotencyKey: string
      input: Parameters<typeof paymentApi.refund>[2]
    }) => paymentApi.refund(paymentId, idempotencyKey, input),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
        refetchType: 'all',
      })
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
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
    },
  })
}

export function useReconcileVnPayRefund() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) =>
      paymentApi.reconcileRefund(paymentId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
        refetchType: 'all',
      })
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
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
    },
  })
}

/**
 * Resolves a duplicate VNPay charge. Unlike standard refund, duplicate
 * resolution leaves the booking and its canonical payment untouched, so
 * booking/room caches are still refreshed (refund fields on the booking can
 * change) while payment data is always refetched authoritatively.
 */
export function useResolveDuplicateCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      paymentId,
      idempotencyKey,
    }: {
      paymentId: string
      idempotencyKey: string
    }) => paymentApi.resolveDuplicateCharge(paymentId, idempotencyKey),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentKeys.all,
        refetchType: 'all',
      })
      void queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
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
    },
  })
}

export function useVnPayReturn(search: string) {
  return useQuery({
    queryKey: paymentKeys.vnPayReturn(search),
    queryFn: ({ signal }) => paymentApi.verifyVnPayReturn(search, signal),
    enabled: search.includes('vnp_'),
    retry: 1,
  })
}
