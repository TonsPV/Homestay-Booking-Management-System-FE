import { apiRequest } from '@/api/client'
import type { QueryParams, QueryPrimitive } from '@/api/types'

import type {
  CreateManualPaymentInput,
  CreateVnPayPaymentInput,
  CustomerPayment,
  OnlinePayment,
  Payment,
  PaymentListQuery,
  RefundPaymentInput,
  VnPayReturnResult,
} from './types'

function paymentListQuery(query: PaymentListQuery) {
  return {
    limit: query.limit,
    method: query.method,
    page: query.page,
    status: query.status,
  }
}

export function queryParamsFromSearch(search: string): QueryParams {
  const result: Record<string, QueryPrimitive | QueryPrimitive[]> = {}
  const searchParams = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )

  for (const [key, value] of searchParams.entries()) {
    const current = result[key]

    if (current === undefined) {
      result[key] = value
    } else if (Array.isArray(current)) {
      current.push(value)
    } else {
      result[key] = [current, value]
    }
  }

  return result
}

export const paymentApi = {
  listCustomer(
    bookingId: string,
    query: PaymentListQuery,
    signal?: AbortSignal,
  ) {
    return apiRequest<CustomerPayment[]>(`/bookings/${bookingId}/payments`, {
      query: paymentListQuery(query),
      signal,
    })
  },

  async createVnPay(
    bookingId: string,
    idempotencyKey: string,
    input: CreateVnPayPaymentInput,
  ) {
    const result = await apiRequest<OnlinePayment>(
      `/bookings/${bookingId}/payments`,
      {
        body: input,
        headers: { 'Idempotency-Key': idempotencyKey },
        method: 'POST',
      },
    )
    return result.data
  },

  listManagement(query: PaymentListQuery, signal?: AbortSignal) {
    return apiRequest<Payment[]>('/management/payments', {
      query: paymentListQuery(query),
      signal,
    })
  },

  listManagementBooking(
    bookingId: string,
    query: PaymentListQuery,
    signal?: AbortSignal,
  ) {
    return apiRequest<Payment[]>(
      `/management/bookings/${bookingId}/payments`,
      {
        query: paymentListQuery(query),
        signal,
      },
    )
  },

  async createManual(
    bookingId: string,
    idempotencyKey: string,
    input: CreateManualPaymentInput,
  ) {
    const result = await apiRequest<Payment>(
      `/management/bookings/${bookingId}/payments`,
      {
        body: input,
        headers: { 'Idempotency-Key': idempotencyKey },
        method: 'POST',
      },
    )
    return result.data
  },

  async refund(
    paymentId: string,
    idempotencyKey: string,
    input: RefundPaymentInput,
  ) {
    const result = await apiRequest<Payment>(
      `/management/payments/${paymentId}/refund`,
      {
        body: input,
        headers: { 'Idempotency-Key': idempotencyKey },
        method: 'POST',
      },
    )
    return result.data
  },

  async reconcileRefund(paymentId: string) {
    const result = await apiRequest<Payment>(
      `/management/payments/${paymentId}/reconcile-refund`,
      { method: 'POST' },
    )
    return result.data
  },

  async verifyVnPayReturn(search: string, signal?: AbortSignal) {
    const result = await apiRequest<VnPayReturnResult>(
      '/payments/vnpay/return',
      {
        auth: false,
        query: queryParamsFromSearch(search),
        signal,
      },
    )
    return result.data
  },
}
