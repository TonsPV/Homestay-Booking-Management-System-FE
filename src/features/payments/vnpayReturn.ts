import type { PersistedVnPayAttempt } from './idempotency'
import {
  PAYMENT_STATUSES,
  type PaymentStatus,
  type VnPayReturnResult,
} from './types'

const ENTITY_ID_PATTERN = /^[1-9][0-9]*$/
const RESPONSE_CODE_PATTERN = /^[A-Za-z0-9]{2}$/

function singleValue(
  searchParams: URLSearchParams,
  key: string,
): string | null | undefined {
  const values = searchParams.getAll(key)

  if (values.length === 0) {
    return null
  }

  return values.length === 1 ? values[0] : undefined
}

function nullableEntityId(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return value
  }

  return ENTITY_ID_PATTERN.test(value) ? value : undefined
}

function nullableResponseCode(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return value
  }

  return RESPONSE_CODE_PATTERN.test(value) ? value : undefined
}

function nullablePaymentStatus(
  value: string | null | undefined,
): PaymentStatus | null | undefined {
  if (value === null) {
    return null
  }

  return PAYMENT_STATUSES.includes(value as PaymentStatus)
    ? (value as PaymentStatus)
    : undefined
}

export function hasVnPayGatewayParameters(search: string) {
  const searchParams = new URLSearchParams(search)

  return [...searchParams.keys()].some((key) => key.startsWith('vnp_'))
}

export function parseVnPayFrontendReturn(
  search: string,
): VnPayReturnResult | null {
  const searchParams = new URLSearchParams(search)
  const validSignatureValue = singleValue(
    searchParams,
    'validSignature',
  )

  if (
    validSignatureValue !== 'true' &&
    validSignatureValue !== 'false'
  ) {
    return null
  }

  const paymentId = nullableEntityId(
    singleValue(searchParams, 'paymentId'),
  )
  const bookingId = nullableEntityId(
    singleValue(searchParams, 'bookingId'),
  )
  const paymentStatus = nullablePaymentStatus(
    singleValue(searchParams, 'paymentStatus'),
  )
  const responseCode = nullableResponseCode(
    singleValue(searchParams, 'responseCode'),
  )
  const transactionStatus = nullableResponseCode(
    singleValue(searchParams, 'transactionStatus'),
  )

  if (
    paymentId === undefined ||
    bookingId === undefined ||
    paymentStatus === undefined ||
    responseCode === undefined ||
    transactionStatus === undefined
  ) {
    return null
  }

  return {
    bookingId,
    paymentId,
    paymentStatus,
    responseCode,
    transactionStatus,
    validSignature: validSignatureValue === 'true',
  }
}

export function matchesVnPayReturnAttempt(
  attempt: PersistedVnPayAttempt | null,
  result: VnPayReturnResult | undefined,
) {
  return Boolean(
    attempt &&
      result?.validSignature &&
      result.bookingId === attempt.bookingId &&
      result.paymentId &&
      (attempt.paymentId === undefined ||
        result.paymentId === attempt.paymentId),
  )
}

export function getVnPayCustomerBookingId(
  attempt: PersistedVnPayAttempt | null,
  result: VnPayReturnResult | undefined,
) {
  if (!result?.validSignature || !result.bookingId) {
    return null
  }

  if (attempt === null) {
    return result.bookingId
  }

  return matchesVnPayReturnAttempt(attempt, result)
    ? attempt.bookingId
    : null
}
