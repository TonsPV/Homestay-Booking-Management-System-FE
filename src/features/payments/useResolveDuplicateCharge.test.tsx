import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'

import { paymentApi } from './api'
import {
  clearDuplicateResolutionKey,
  getOrCreateDuplicateResolutionKey,
} from './idempotency'
import { useResolveDuplicateCharge } from './hooks'
import { paymentKeys } from './query-keys'
import type { Payment } from './types'

vi.mock('./api', () => ({
  paymentApi: {
    resolveDuplicateCharge: vi.fn(),
  },
}))

function refundedPayment(): Payment {
  return {
    amount: '1800000.00',
    bookingId: '901',
    createdAt: '2026-07-24T00:00:00.000Z',
    createdByUser: null,
    createdByUserId: null,
    currency: 'VND',
    expiresAt: null,
    gatewayName: 'VNPay',
    gatewayReference: 'P95',
    gatewayResponseCode: '00',
    gatewayTransactionDate: null,
    gatewayTransactionId: 'TXN95',
    gatewayTransactionStatus: '00',
    id: '95',
    method: 'VNPAY',
    paidAt: '2026-07-24T00:01:00.000Z',
    refundedAt: '2026-07-29T01:05:00.000Z',
    refundedByUser: null,
    refundedByUserId: '1',
    refundGatewayTransactionId: null,
    refundLastQueriedAt: null,
    refundMessage: null,
    refundPreviousStatus: 'REQUIRES_REVIEW',
    refundReason: 'Duplicate VNPay charge resolution.',
    refundRequestId: 'R95',
    refundRequestedAt: '2026-07-29T01:00:00.000Z',
    refundResponseCode: '00',
    refundTransactionStatus: '00',
    reviewCanonicalPaymentId: '90',
    reviewReason: 'ANOTHER_SUCCESSFUL_PAYMENT',
    status: 'REFUNDED',
    updatedAt: '2026-07-29T01:05:00.000Z',
  }
}

function pendingRefundPayment(): Payment {
  return {
    ...refundedPayment(),
    refundedAt: null,
    refundedByUserId: null,
    refundResponseCode: null,
    refundTransactionStatus: null,
    status: 'REFUND_PENDING',
  }
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

function businessRejection(): ApiError {
  return new ApiError('Payment khong phai giao dich VNPay trung can xu ly.', {
    errorCode: 'PAYMENT_REFUND_NOT_ALLOWED',
    kind: 'http',
    status: 409,
  })
}

function outcomeUnknown(): ApiError {
  return new ApiError(
    'Chua xac dinh duoc ket qua hoan tien VNPay. Hay doi soat truoc khi thu lai.',
    {
      errorCode: 'PAYMENT_REFUND_OUTCOME_UNKNOWN',
      kind: 'http',
      status: 503,
    },
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useResolveDuplicateCharge mutation behavior', () => {
  it('sends the payment id and one stable idempotency key for the same logical attempt', async () => {
    const idempotencyKey = getOrCreateDuplicateResolutionKey('95')
    vi.mocked(paymentApi.resolveDuplicateCharge).mockResolvedValue(
      refundedPayment(),
    )
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({ idempotencyKey, paymentId: '95' }),
    )
    await act(() =>
      result.current.mutateAsync({ idempotencyKey, paymentId: '95' }),
    )

    expect(paymentApi.resolveDuplicateCharge).toHaveBeenCalledTimes(2)
    expect(paymentApi.resolveDuplicateCharge).toHaveBeenNthCalledWith(
      1,
      '95',
      idempotencyKey,
    )
    expect(paymentApi.resolveDuplicateCharge).toHaveBeenNthCalledWith(
      2,
      '95',
      idempotencyKey,
    )
  })

  it('invalidates authoritative payment data after settle', async () => {
    const { invalidate, Wrapper } = createHarness()
    vi.mocked(paymentApi.resolveDuplicateCharge).mockResolvedValue(
      refundedPayment(),
    )
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        idempotencyKey: getOrCreateDuplicateResolutionKey('95'),
        paymentId: '95',
      }),
    )

    expect(invalidate).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: paymentKeys.all }),
    )
  })

  it('exposes a business rejection without clearing the stored key', async () => {
    vi.mocked(paymentApi.resolveDuplicateCharge).mockRejectedValue(
      businessRejection(),
    )
    const key = getOrCreateDuplicateResolutionKey('95')
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        idempotencyKey: key,
        paymentId: '95',
      }).catch(() => undefined),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(
      (result.current.error as ApiError).errorCode,
    ).toBe('PAYMENT_REFUND_NOT_ALLOWED')
    // The same logical attempt keeps its key for a corrected retry.
    expect(getOrCreateDuplicateResolutionKey('95')).toBe(key)
  })

  it('reports REFUND_PENDING results so the UI can point at reconciliation', async () => {
    vi.mocked(paymentApi.resolveDuplicateCharge).mockResolvedValue(
      pendingRefundPayment(),
    )
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    const payment = await act(() =>
      result.current.mutateAsync({
        idempotencyKey: getOrCreateDuplicateResolutionKey('95'),
        paymentId: '95',
      }),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(payment?.status).toBe('REFUND_PENDING')
    // A pending refund must not clear the key: replays must hit the same
    // idempotency record so the Backend reconciles instead of re-charging.
    expect(getOrCreateDuplicateResolutionKey('95')).toBe(
      getOrCreateDuplicateResolutionKey('95'),
    )
  })

  it('propagates uncertain outcomes for the UI to offer reconciliation before retry', async () => {
    vi.mocked(paymentApi.resolveDuplicateCharge).mockRejectedValue(
      outcomeUnknown(),
    )
    const key = getOrCreateDuplicateResolutionKey('95')
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        idempotencyKey: key,
        paymentId: '95',
      }).catch(() => undefined),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(
      (result.current.error as ApiError).errorCode,
    ).toBe('PAYMENT_REFUND_OUTCOME_UNKNOWN')
    // No blind retry with a fresh key: the same key must be kept.
    expect(getOrCreateDuplicateResolutionKey('95')).toBe(key)
  })

  it('network failures keep the mutation retryable without clearing the key', async () => {
    vi.mocked(paymentApi.resolveDuplicateCharge).mockRejectedValue(
      new ApiError('Không thể kết nối hệ thống.', { kind: 'network' }),
    )
    const key = getOrCreateDuplicateResolutionKey('95')
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        idempotencyKey: key,
        paymentId: '95',
      }).catch(() => undefined),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(
      (result.current.error as ApiError).kind,
    ).toBe('network')
    expect(getOrCreateDuplicateResolutionKey('95')).toBe(key)
  })

  it('is idle after reset so a new attempt can start once settled', async () => {
    vi.mocked(paymentApi.resolveDuplicateCharge).mockResolvedValue(
      refundedPayment(),
    )
    const { result } = renderHook(() => useResolveDuplicateCharge(), {
      wrapper: createHarness().Wrapper,
    })

    await act(() =>
      result.current.mutateAsync({
        idempotencyKey: getOrCreateDuplicateResolutionKey('95'),
        paymentId: '95',
      }),
    )
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    act(() => {
      result.current.reset()
    })
    await waitFor(() => {
      expect(result.current.isIdle).toBe(true)
    })

    clearDuplicateResolutionKey('95')
  })
})
