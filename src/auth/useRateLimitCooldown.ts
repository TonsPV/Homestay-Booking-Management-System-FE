import { useEffect, useState } from 'react'

import { ApiError, getErrorMessage } from '@/api/errors'

export function getRetryAfterSeconds(error: unknown) {
  if (!(error instanceof ApiError) || !error.isStatus(429)) {
    return null
  }

  const retryAfterSeconds = error.retryAfterSeconds

  if (
    retryAfterSeconds === undefined ||
    !Number.isFinite(retryAfterSeconds) ||
    retryAfterSeconds <= 0
  ) {
    return null
  }

  return Math.ceil(retryAfterSeconds)
}

export function formatRetryAfter(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  if (minutes === 0) {
    return `${remainingSeconds} giây`
  }

  if (remainingSeconds === 0) {
    return `${minutes} phút`
  }

  return `${minutes} phút ${remainingSeconds} giây`
}

export function getRateLimitErrorMessage(
  error: unknown,
  remainingSeconds: number,
  fallback: (error: unknown) => string = getErrorMessage,
) {
  if (getRetryAfterSeconds(error) === null || remainingSeconds <= 0) {
    return fallback(error)
  }

  return `Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ${formatRetryAfter(remainingSeconds)}.`
}

export function useRateLimitCooldown(error: unknown) {
  const retryAfterSeconds = getRetryAfterSeconds(error)
  const [remainingSeconds, setRemainingSeconds] = useState(
    retryAfterSeconds ?? 0,
  )

  useEffect(() => {
    if (retryAfterSeconds === null) {
      setRemainingSeconds(0)
      return
    }

    const deadline = Date.now() + retryAfterSeconds * 1_000
    let timer: number | undefined

    const updateRemainingTime = () => {
      const nextValue = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1_000),
      )

      setRemainingSeconds(nextValue)

      if (nextValue === 0 && timer !== undefined) {
        window.clearInterval(timer)
      }
    }

    setRemainingSeconds(retryAfterSeconds)
    timer = window.setInterval(updateRemainingTime, 1_000)

    return () => window.clearInterval(timer)
  }, [error, retryAfterSeconds])

  return {
    isCoolingDown: remainingSeconds > 0,
    remainingSeconds,
  }
}
