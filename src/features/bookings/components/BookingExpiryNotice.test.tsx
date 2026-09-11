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

  it('shows hours and minutes when remaining time is greater than 15 minutes', () => {
    vi.useFakeTimers()
    const baseTime = new Date('2026-07-29T10:00:00.000Z')
    vi.setSystemTime(baseTime)

    // 45 minutes remaining
    const booking45m = {
      paymentExpiresAt: '2026-07-29T10:45:00.000Z',
      paymentStatus: 'UNPAID',
      status: 'PENDING_PAYMENT',
    } as Booking

    render(<BookingExpiryNotice booking={booking45m} />)

    expect(screen.getByText('Còn khoảng 45 phút để thanh toán.')).toBeInTheDocument()
  })

  it('switches to mm:ss countdown and ticks every second when remaining time <= 15 minutes', () => {
    vi.useFakeTimers()
    const baseTime = new Date('2026-07-29T10:00:00.000Z')
    vi.setSystemTime(baseTime)

    // 10 minutes (600 seconds) remaining
    const booking10m = {
      paymentExpiresAt: '2026-07-29T10:10:00.000Z',
      paymentStatus: 'UNPAID',
      status: 'PENDING_PAYMENT',
    } as Booking

    render(<BookingExpiryNotice booking={booking10m} />)

    expect(screen.getByText('Còn 10:00 để thanh toán.')).toBeInTheDocument()

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5_000)
    })

    expect(screen.getByText('Còn 09:55 để thanh toán.')).toBeInTheDocument()
  })

  it('displays syncing cancellation status and notifies onExpired when time reaches 00:00', () => {
    vi.useFakeTimers()
    const baseTime = new Date('2026-07-29T10:00:00.000Z')
    vi.setSystemTime(baseTime)
    const onExpired = vi.fn()

    // 2 seconds remaining
    const booking2s = {
      paymentExpiresAt: '2026-07-29T10:00:02.000Z',
      paymentStatus: 'UNPAID',
      status: 'PENDING_PAYMENT',
    } as Booking

    render(<BookingExpiryNotice booking={booking2s} onExpired={onExpired} />)

    expect(screen.getByText('Còn 00:02 để thanh toán.')).toBeInTheDocument()

    // Advance 2 seconds to reach 00:00
    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(onExpired).toHaveBeenCalledWith('2026-07-29T10:00:02.000Z')
    expect(
      screen.getByText('Thời hạn thanh toán đã kết thúc. Chúng tôi đang cập nhật trạng thái đặt phòng...'),
    ).toBeInTheDocument()
  })
})
