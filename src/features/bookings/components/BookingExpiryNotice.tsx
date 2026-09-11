import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Alert } from '@/shared/components/Feedback'
import { formatDateTime } from '@/shared/formatting/formatters'

import type { Booking } from '../types'

const MAX_BROWSER_TIMEOUT = 2_147_483_647
const FIFTEEN_MINUTES_MS = 15 * 60_000

interface BookingExpiryNoticeProps {
  booking: Booking
  onExpired?: (expiresAt: string) => void
}

function getRemainingLabel(expiresAt: string, now: number) {
  const remainingMilliseconds = Date.parse(expiresAt) - now

  if (remainingMilliseconds <= 0) {
    return 'Thời hạn thanh toán đã kết thúc. Chúng tôi đang cập nhật trạng thái đặt phòng...'
  }

  if (remainingMilliseconds <= FIFTEEN_MINUTES_MS) {
    const totalSeconds = Math.max(0, Math.floor(remainingMilliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    return `Còn ${mm}:${ss} để thanh toán.`
  }

  const totalMinutes = Math.ceil(remainingMilliseconds / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `Còn khoảng ${hours} giờ ${minutes} phút để thanh toán.`
  }

  return `Còn khoảng ${minutes} phút để thanh toán.`
}

export function BookingExpiryNotice({
  booking,
  onExpired,
}: BookingExpiryNoticeProps) {
  const [now, setNow] = useState(() => Date.now())
  const reportedExpiry = useRef<string | null>(null)

  useEffect(() => {
    const paymentExpiresAt = booking.paymentExpiresAt
    if (!paymentExpiresAt) {
      return
    }

    const expiresAt = Date.parse(paymentExpiresAt)
    if (!Number.isFinite(expiresAt)) {
      return
    }

    const getTickInterval = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        return null
      }
      return remaining <= FIFTEEN_MINUTES_MS ? 1_000 : 10_000
    }

    let timer: number | undefined

    const tick = () => {
      setNow(Date.now())
      const interval = getTickInterval()
      if (interval !== null) {
        timer = window.setTimeout(tick, interval)
      }
    }

    const initialInterval = getTickInterval()
    if (initialInterval !== null) {
      timer = window.setTimeout(tick, initialInterval)
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [booking.paymentExpiresAt])

  useEffect(() => {
    const paymentExpiresAt = booking.paymentExpiresAt

    if (
      booking.status !== 'PENDING_PAYMENT' ||
      booking.paymentStatus !== 'UNPAID' ||
      !paymentExpiresAt
    ) {
      return
    }

    const expiresAt = Date.parse(paymentExpiresAt)

    if (!Number.isFinite(expiresAt)) {
      return
    }

    const notifyExpired = () => {
      setNow(Date.now())

      if (reportedExpiry.current !== paymentExpiresAt) {
        reportedExpiry.current = paymentExpiresAt
        onExpired?.(paymentExpiresAt)
      }
    }
    let timeout: number | undefined

    const scheduleExpiryCheck = () => {
      const remaining = expiresAt - Date.now()

      if (remaining <= 0) {
        notifyExpired()
        return
      }

      timeout = window.setTimeout(
        scheduleExpiryCheck,
        Math.min(remaining, MAX_BROWSER_TIMEOUT),
      )
    }

    scheduleExpiryCheck()

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
      }
    }
  }, [
    booking.paymentExpiresAt,
    booking.paymentStatus,
    booking.status,
    onExpired,
  ])

  if (
    booking.status !== 'PENDING_PAYMENT' ||
    booking.paymentStatus !== 'UNPAID' ||
    !booking.paymentExpiresAt
  ) {
    return null
  }

  const expired = Date.parse(booking.paymentExpiresAt) <= now

  return (
    <Alert tone={expired ? 'warning' : 'info'} title="Hạn thanh toán">
      <p>{getRemainingLabel(booking.paymentExpiresAt, now)}</p>
      <p className="mt-1 text-xs">
        Mốc thời gian: {formatDateTime(booking.paymentExpiresAt)}
      </p>
    </Alert>
  )
}
