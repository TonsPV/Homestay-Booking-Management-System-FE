import type { PersistedVnPayAttempt } from './idempotency'
import type {
  Payment,
  PaymentStatus,
} from './types'

const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = [
  'SUCCESS',
  'FAILED',
  'REQUIRES_REVIEW',
  'REFUND_PENDING',
  'REFUNDED',
]

type PaymentAttemptSnapshot = Pick<
  Payment,
  'id' | 'method' | 'status'
>

export type VnPayAttemptDecision =
  | {
      attempt: PersistedVnPayAttempt
      kind: 'replay'
    }
  | {
      clearStoredAttempt: boolean
      kind: 'new'
    }
  | {
      kind: 'blocked'
      paymentId: string
      reason: 'pending-without-key' | 'unknown-stored-payment'
    }

export function isTerminalPaymentStatus(status: PaymentStatus) {
  return TERMINAL_PAYMENT_STATUSES.includes(status)
}

export function getBoundedPaymentPollingInterval(
  deadline: number | null,
  status: PaymentStatus | undefined,
  now = Date.now(),
): number | false {
  if (
    deadline === null ||
    now >= deadline ||
    (status !== undefined && isTerminalPaymentStatus(status))
  ) {
    return false
  }

  return Math.max(250, Math.min(2_000, deadline - now))
}

export function findPendingVnPayPayment(
  payments: PaymentAttemptSnapshot[],
) {
  return payments.find(
    (payment) =>
      payment.method === 'VNPAY' && payment.status === 'PENDING',
  )
}

export function decideVnPayAttempt(
  bookingId: string,
  payments: PaymentAttemptSnapshot[],
  storedAttempt: PersistedVnPayAttempt | null,
): VnPayAttemptDecision {
  const attempt =
    storedAttempt?.bookingId === bookingId ? storedAttempt : null
  const pendingPayment = findPendingVnPayPayment(payments)

  if (pendingPayment) {
    if (
      attempt &&
      (attempt.paymentId === undefined ||
        attempt.paymentId === pendingPayment.id)
    ) {
      return { attempt, kind: 'replay' }
    }

    return {
      kind: 'blocked',
      paymentId: pendingPayment.id,
      reason: 'pending-without-key',
    }
  }

  if (!attempt) {
    return { clearStoredAttempt: false, kind: 'new' }
  }

  const knownPayment = attempt.paymentId
    ? payments.find((payment) => payment.id === attempt.paymentId)
    : undefined

  if (attempt.paymentId && !knownPayment) {
    return {
      kind: 'blocked',
      paymentId: attempt.paymentId,
      reason: 'unknown-stored-payment',
    }
  }

  if (
    knownPayment &&
    isTerminalPaymentStatus(knownPayment.status)
  ) {
    return { clearStoredAttempt: true, kind: 'new' }
  }

  return { attempt, kind: 'replay' }
}
