import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Booking } from '../types'
import { BookingExpiryNotice } from './BookingExpiryNotice'

const booking = {
  paymentExpiresAt: '2099-04-01T00:15:00.000Z',
  paymentStatus: 'UNPAID',
  status: 'PENDING_PAYMENT',
} as Booking

describe('BookingExpiryNotice', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not expire a deadline beyond the browser timeout limit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-29T00:00:00.000Z'))
    const onExpired = vi.fn()

    render(
      <BookingExpiryNotice booking={booking} onExpired={onExpired} />,
    )

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(onExpired).not.toHaveBeenCalled()
    expect(screen.getByText(/để thanh toán/)).toBeInTheDocument()
  })
})
