import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'

import {
  formatRetryAfter,
  getRateLimitErrorMessage,
  getRetryAfterSeconds,
  useRateLimitCooldown,
} from './useRateLimitCooldown'

afterEach(() => {
  vi.useRealTimers()
})

describe('rate-limit helpers', () => {
  it('reads Retry-After only from a valid 429 API error', () => {
    const rateLimitError = new ApiError('Too many requests.', {
      kind: 'http',
      retryAfterSeconds: 45.2,
      status: 429,
    })
    const forbiddenError = new ApiError('Forbidden.', {
      kind: 'http',
      retryAfterSeconds: 45,
      status: 403,
    })

    expect(getRetryAfterSeconds(rateLimitError)).toBe(46)
    expect(getRetryAfterSeconds(forbiddenError)).toBeNull()
    expect(getRetryAfterSeconds(new Error('Unknown'))).toBeNull()
  })

  it('formats a readable Vietnamese duration and feedback message', () => {
    const error = new ApiError('Too many requests.', {
      kind: 'http',
      retryAfterSeconds: 75,
      status: 429,
    })

    expect(formatRetryAfter(45)).toBe('45 giây')
    expect(formatRetryAfter(60)).toBe('1 phút')
    expect(formatRetryAfter(75)).toBe('1 phút 15 giây')
    expect(getRateLimitErrorMessage(error, 75)).toContain(
      'thử lại sau 1 phút 15 giây',
    )
  })
})

describe('useRateLimitCooldown', () => {
  it('counts down from Retry-After and releases the form at zero', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-24T12:00:00.000Z'))

    const error = new ApiError('Too many requests.', {
      kind: 'http',
      retryAfterSeconds: 3,
      status: 429,
    })
    const { result } = renderHook(() => useRateLimitCooldown(error))

    expect(result.current).toEqual({
      isCoolingDown: true,
      remainingSeconds: 3,
    })

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.remainingSeconds).toBe(2)

    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(result.current).toEqual({
      isCoolingDown: false,
      remainingSeconds: 0,
    })
  })
})
