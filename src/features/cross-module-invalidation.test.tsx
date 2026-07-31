import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import * as amenityApi from '@/features/amenities/api'
import { amenityKeys } from '@/features/amenities/query-keys'
import { useUpdateAmenity } from '@/features/amenities/hooks'
import { bookingApi } from '@/features/bookings/api'
import { useCreateManagementBooking } from '@/features/bookings/hooks'
import { bookingKeys } from '@/features/bookings/query-keys'
import { dashboardKeys } from '@/features/dashboard/query-keys'
import { paymentApi } from '@/features/payments/api'
import { useCreateManualPayment } from '@/features/payments/hooks'
import { paymentKeys } from '@/features/payments/query-keys'
import * as roomApi from '@/features/rooms/api'
import { useBlockRoomDates } from '@/features/rooms/hooks'
import { roomKeys } from '@/features/rooms/query-keys'
import { roomTypeKeys } from '@/features/room-types/query-keys'

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return { invalidate, queryClient, Wrapper }
}

function expectInvalidated(
  invalidate: ReturnType<typeof vi.spyOn>,
  queryKey: readonly unknown[],
) {
  expect(invalidate).toHaveBeenCalledWith(
    expect.objectContaining({ queryKey }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cross-module query invalidation', () => {
  it('refreshes booking, room and dashboard after a counter booking', async () => {
    vi.spyOn(bookingApi, 'createManagement').mockResolvedValue({
      id: '901',
    } as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateManagementBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        checkInDate: '2026-08-10',
        checkOutDate: '2026-08-12',
        contactName: 'Khách tại quầy',
        contactPhone: '0901234567',
        guestCount: 2,
        roomId: '10',
      }),
    )

    expectInvalidated(invalidate, bookingKeys.management())
    expectInvalidated(invalidate, roomKeys.all)
    expectInvalidated(invalidate, dashboardKeys.all)
  })

  it('refreshes payment, booking, room and dashboard after manual payment', async () => {
    vi.spyOn(paymentApi, 'createManual').mockResolvedValue({
      id: 'payment-91',
    } as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateManualPayment(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        bookingId: '901',
        idempotencyKey: 'manual-test-key',
        input: { method: 'CASH' },
      }),
    )

    expectInvalidated(invalidate, paymentKeys.management())
    expectInvalidated(invalidate, bookingKeys.all)
    expectInvalidated(invalidate, roomKeys.all)
    expectInvalidated(invalidate, dashboardKeys.all)
  })

  it('refreshes room and dashboard occupancy after calendar blocking', async () => {
    vi.spyOn(roomApi, 'blockRoomDates').mockResolvedValue([] as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useBlockRoomDates(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        input: {
          from: '2026-08-10',
          reason: 'Bảo trì định kỳ',
          to: '2026-08-11',
        },
        roomId: '10',
      }),
    )

    expectInvalidated(invalidate, roomKeys.all)
    expectInvalidated(invalidate, dashboardKeys.all)
  })

  it('refreshes dependent room types and rooms after an amenity update', async () => {
    vi.spyOn(amenityApi, 'updateAmenity').mockResolvedValue({
      id: 'amenity-5',
    } as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useUpdateAmenity(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        id: 'amenity-5',
        input: { name: 'Wi-Fi tốc độ cao' },
      }),
    )

    expectInvalidated(invalidate, amenityKeys.all)
    expectInvalidated(invalidate, roomTypeKeys.all)
    expectInvalidated(invalidate, roomKeys.all)
  })
})
