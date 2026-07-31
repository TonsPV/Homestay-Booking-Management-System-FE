import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { Alert } from '@/shared/components/Feedback'
import { formatDateTime } from '@/shared/formatting/formatters'

import type { Booking } from '../types'

const MAX_BROWSER_TIMEOUT = 2_147_483_647

interface BookingExpiryNoticeProps {
  booking: Booking
  onExpired?: (expiresAt: string) => void
}

function getRemainingLabel(expiresAt: string, now: number) {
  const remainingMilliseconds = Date.parse(expiresAt) - now

  if (remainingMilliseconds <= 0) {
    return 'Thời hạn thanh toán đã kết thúc. Trạng thái sẽ được hệ thống cập nhật.'
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
    const interval = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

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
