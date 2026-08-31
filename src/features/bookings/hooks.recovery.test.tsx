import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'
import type { AuthPrincipal } from '@/auth/types'
import { paymentKeys } from '@/features/payments/query-keys'
import { roomKeys } from '@/features/rooms/query-keys'

import { bookingApi } from './api'
import {
  useCancelCustomerBooking,
  useCreateCustomerBooking,
  useCreateManagementBooking,
  useUpdateBookingStatus,
} from './hooks'
import {
  getOrCreateBookingIntentKey,
  resetBookingIntentMemoryForTests,
} from './idempotency'
import { bookingKeys } from './query-keys'
import type { CreateBookingInput } from './types'

const authState = vi.hoisted(() => ({
  principal: null as AuthPrincipal | null,
}))

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ principal: authState.principal }),
}))

function customerPrincipal(id = 'customer-a-id'): AuthPrincipal {
  return { actorType: 'customer', id } as AuthPrincipal
}

function userPrincipal(id = 'user-a-id'): AuthPrincipal {
  return { actorType: 'user', id } as AuthPrincipal
}

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
    expect.objectContaining({ queryKey, refetchType: 'all' }),
  )
}

const createInput: CreateBookingInput = {
  checkInDate: '2026-09-10',
  checkOutDate: '2026-09-12',
  guestCount: 2,
  roomId: '12',
}

beforeEach(() => {
  localStorage.clear()
  resetBookingIntentMemoryForTests()
  authState.principal = customerPrincipal()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('booking mutation recovery', () => {
  it('replays an uncertain customer create with the same actor-scoped key', async () => {
    const create = vi
      .spyOn(bookingApi, 'createCustomer')
      .mockRejectedValueOnce(
        new ApiError('Không thể kết nối hệ thống.', { kind: 'network' }),
      )
      .mockResolvedValueOnce({ id: '91' } as never)
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync(createInput).catch(() => undefined),
    )
    await act(() => result.current.mutateAsync(createInput))

    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0]?.[1]).toBe(create.mock.calls[1]?.[1])
  })

  it('starts a fresh customer key after authoritative success', async () => {
    const create = vi
      .spyOn(bookingApi, 'createCustomer')
      .mockResolvedValue({ id: '91' } as never)
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() => result.current.mutateAsync(createInput))
    await act(() => result.current.mutateAsync(createInput))

    expect(create.mock.calls[0]?.[1]).not.toBe(create.mock.calls[1]?.[1])
  })

  it('replays an uncertain management create with the same actor-scoped key', async () => {
    authState.principal = userPrincipal()
    const input = {
      ...createInput,
      contactName: 'Nguyễn Văn A',
      contactPhone: '0901234567',
    }
    const create = vi
      .spyOn(bookingApi, 'createManagement')
      .mockRejectedValueOnce(
        new ApiError('Không thể kết nối hệ thống.', { kind: 'network' }),
      )
      .mockResolvedValueOnce({ id: '92' } as never)
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateManagementBooking(), {
      wrapper: Wrapper,
    })

    await act(() => result.current.mutateAsync(input).catch(() => undefined))
    await act(() => result.current.mutateAsync(input))

    expect(create.mock.calls[0]?.[1]).toBe(create.mock.calls[1]?.[1])
  })

  it('quarantines only the current customer actor intent on exact conflict', async () => {
    const actorId = authState.principal?.id ?? ''
    const otherInput = { ...createInput, roomId: '13' }
    const poisonedKey = getOrCreateBookingIntentKey(
      'customer',
      actorId,
      createInput,
    )
    const otherKey = getOrCreateBookingIntentKey(
      'customer',
      actorId,
      otherInput,
    )
    vi.spyOn(bookingApi, 'createCustomer').mockRejectedValue(
      new ApiError('Request intent conflict', {
        errorCode: 'BOOKING_REQUEST_INTENT_CONFLICT',
        kind: 'http',
        status: 409,
      }),
    )
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync(createInput).catch(() => undefined),
    )

    expect(
      getOrCreateBookingIntentKey('customer', actorId, createInput),
    ).not.toBe(poisonedKey)
    expect(
      getOrCreateBookingIntentKey('customer', actorId, otherInput),
    ).toBe(otherKey)
    expectInvalidated(invalidate, bookingKeys.customer())
  })

  it('does not quarantine a customer intent for room availability conflict', async () => {
    const actorId = authState.principal?.id ?? ''
    const existingKey = getOrCreateBookingIntentKey(
      'customer',
      actorId,
      createInput,
    )
    vi.spyOn(bookingApi, 'createCustomer').mockRejectedValue(
      new ApiError('Room unavailable', {
        errorCode: 'BOOKING_ROOM_UNAVAILABLE',
        kind: 'http',
        status: 409,
      }),
    )
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCreateCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync(createInput).catch(() => undefined),
    )

    expect(
      getOrCreateBookingIntentKey('customer', actorId, createInput),
    ).toBe(existingKey)
  })

  it('uses customer detail as authoritative gate and refreshes secondary state', async () => {
    vi.spyOn(bookingApi, 'cancelCustomer').mockRejectedValue(
      new ApiError('Response lost', { kind: 'network' }),
    )
    const getDetail = vi
      .spyOn(bookingApi, 'getCustomer')
      .mockResolvedValue({ id: '91' } as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useCancelCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current
        .mutateAsync({ id: '91', input: { reason: 'Đổi kế hoạch' } })
        .catch(() => undefined),
    )

    expect(getDetail).toHaveBeenCalledWith('91', expect.any(AbortSignal))
    expect(result.current.reconciliationState).toBe('authoritative')
    expectInvalidated(
      invalidate,
      bookingKeys.customerLists(),
    )
    expectInvalidated(invalidate, paymentKeys.customer('91'))
    expectInvalidated(invalidate, roomKeys.all)
  })

  it('keeps customer UI state unknown when authoritative detail refetch fails', async () => {
    const cancel = vi.spyOn(bookingApi, 'cancelCustomer').mockRejectedValue(
      new ApiError('Response lost', { kind: 'network' }),
    )
    const getDetail = vi
      .spyOn(bookingApi, 'getCustomer')
      .mockRejectedValueOnce(new Error('detail unavailable'))
      .mockResolvedValueOnce({ id: '91' } as never)
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCancelCustomerBooking(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current
        .mutateAsync({ id: '91', input: { reason: 'Đổi kế hoạch' } })
        .catch(() => undefined),
    )

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(result.current.isStateUnknown).toBe(true)
    expect(result.current.isReconciling).toBe(false)

    await act(() => result.current.retryReconciliation('91'))

    expect(getDetail).toHaveBeenCalledTimes(2)
    expect(result.current.reconciliationState).toBe('authoritative')
    expect(result.current.isStateUnknown).toBe(false)
  })

  it('keeps customer reconciliation pending until detail resolves', async () => {
    let finish: ((booking: never) => void) | undefined
    const reconciliation = new Promise<never>((resolve) => {
      finish = resolve
    })
    vi.spyOn(bookingApi, 'cancelCustomer').mockRejectedValue(
      new ApiError('Response lost', { kind: 'network' }),
    )
    vi.spyOn(bookingApi, 'getCustomer').mockReturnValue(reconciliation)
    const { Wrapper } = createHarness()
    const { result } = renderHook(() => useCancelCustomerBooking(), {
      wrapper: Wrapper,
    })

    let request: Promise<unknown> | undefined
    act(() => {
      request = result.current
        .mutateAsync({ id: '91', input: { reason: 'Đổi kế hoạch' } })
        .catch(() => undefined)
    })

    await waitFor(() => expect(result.current.isReconciling).toBe(true))
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      finish?.({ id: '91' } as never)
      await request
    })

    expect(result.current.reconciliationState).toBe('authoritative')
  })

  it('keeps management transitions unknown until manual detail recovery succeeds', async () => {
    vi.spyOn(bookingApi, 'updateStatus').mockRejectedValue(
      new ApiError('Response lost', { kind: 'network' }),
    )
    const getDetail = vi
      .spyOn(bookingApi, 'getManagement')
      .mockRejectedValueOnce(new Error('detail unavailable'))
      .mockResolvedValueOnce({ id: '92' } as never)
    const { invalidate, Wrapper } = createHarness()
    const { result } = renderHook(() => useUpdateBookingStatus(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current
        .mutateAsync({ id: '92', input: { status: 'CONFIRMED' } })
        .catch(() => undefined),
    )

    expect(result.current.reconciliationState).toBe('unknown')
    expectInvalidated(
      invalidate,
      bookingKeys.managementLists(),
    )
    expectInvalidated(invalidate, paymentKeys.management())

    await act(() => result.current.retryReconciliation('92'))

    expect(getDetail).toHaveBeenCalledTimes(2)
    expect(result.current.reconciliationState).toBe('authoritative')
  })

  it('does not let a secondary refresh rejection override management detail success', async () => {
    vi.spyOn(bookingApi, 'updateStatus').mockRejectedValue(
      new ApiError('Response lost', { kind: 'network' }),
    )
    vi.spyOn(bookingApi, 'getManagement').mockResolvedValue({ id: '92' } as never)
    const { invalidate, Wrapper } = createHarness()
    invalidate.mockRejectedValue(new Error('secondary unavailable'))
    const { result } = renderHook(() => useUpdateBookingStatus(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current
        .mutateAsync({ id: '92', input: { status: 'CONFIRMED' } })
        .catch(() => undefined),
    )

    expect(result.current.reconciliationState).toBe('authoritative')
  })
})
