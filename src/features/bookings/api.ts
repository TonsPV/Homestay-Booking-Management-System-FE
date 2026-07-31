import { apiRequest } from '@/api/client'

import type {
  Booking,
  BookingListQuery,
  CancelBookingInput,
  CreateBookingInput,
  CreateManagementBookingInput,
  ManagementBookingListQuery,
  UpdateBookingStatusInput,
} from './types'

function bookingListQuery(query: BookingListQuery) {
  return {
    limit: query.limit,
    page: query.page,
    status: query.status,
  }
}

function managementBookingListQuery(query: ManagementBookingListQuery) {
  return {
    ...bookingListQuery(query),
    customerId: query.customerId,
    roomId: query.roomId,
    search: query.search,
  }
}

export const bookingApi = {
  listCustomer(query: BookingListQuery, signal?: AbortSignal) {
    return apiRequest<Booking[]>('/bookings', {
      query: bookingListQuery(query),
      signal,
    })
  },

  async getCustomer(id: string, signal?: AbortSignal) {
    const result = await apiRequest<Booking>(`/bookings/${id}`, { signal })
    return result.data
  },

  async createCustomer(input: CreateBookingInput) {
    const result = await apiRequest<Booking>('/bookings', {
      body: input,
      method: 'POST',
    })
    return result.data
  },

  async cancelCustomer(id: string, input: CancelBookingInput) {
    const result = await apiRequest<Booking>(`/bookings/${id}/cancel`, {
      body: input,
      method: 'PATCH',
    })
    return result.data
  },

  listManagement(query: ManagementBookingListQuery, signal?: AbortSignal) {
    return apiRequest<Booking[]>('/management/bookings', {
      query: managementBookingListQuery(query),
      signal,
    })
  },

  async getManagement(id: string, signal?: AbortSignal) {
    const result = await apiRequest<Booking>(
      `/management/bookings/${id}`,
      { signal },
    )
    return result.data
  },

  async createManagement(input: CreateManagementBookingInput) {
    const result = await apiRequest<Booking>('/management/bookings', {
      body: input,
      method: 'POST',
    })
    return result.data
  },

  async updateStatus(id: string, input: UpdateBookingStatusInput) {
    const result = await apiRequest<Booking>(
      `/management/bookings/${id}/status`,
      {
        body: input,
        method: 'PATCH',
      },
    )
    return result.data
  },
}
