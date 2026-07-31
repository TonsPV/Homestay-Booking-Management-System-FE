import type { PaymentMethod } from './types'

const STORAGE_PREFIX = 'hbms:payments'
const MAX_ATTEMPT_AGE = 24 * 60 * 60 * 1_000

export interface PersistedVnPayAttempt {
  bookingId: string
  createdAt: number
  idempotencyKey: string
  paymentId?: string
}

interface PersistedManualAttempt {
  bookingId: string
  createdAt: number
  idempotencyKey: string
  method: Extract<PaymentMethod, 'CASH' | 'BANK_TRANSFER'>
}

interface PersistedRefundAttempt {
  createdAt: number
  idempotencyKey: string
  paymentId: string
}

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in privacy mode; the request still works.
  }
}

function removeStorage(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

function fresh(createdAt: number) {
  const age = Date.now() - createdAt

  return (
    Number.isFinite(createdAt) &&
    createdAt > 0 &&
    age >= 0 &&
    age < MAX_ATTEMPT_AGE
  )
}

function createKey(prefix: 'manual' | 'refund' | 'vnpay') {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${randomPart}`
}

function vnPayStorageKey(bookingId: string) {
  return `${STORAGE_PREFIX}:vnpay:${bookingId}`
}

const currentVnPayStorageKey = `${STORAGE_PREFIX}:vnpay:current`

function isPersistedVnPayAttempt(
  value: PersistedVnPayAttempt | null,
  bookingId?: string,
): value is PersistedVnPayAttempt {
  return (
    value !== null &&
    (bookingId === undefined || value.bookingId === bookingId) &&
    /^[1-9][0-9]*$/.test(value.bookingId) &&
    typeof value.idempotencyKey === 'string' &&
    value.idempotencyKey.length > 0 &&
    (value.paymentId === undefined ||
      /^[1-9][0-9]*$/.test(value.paymentId)) &&
    fresh(value.createdAt)
  )
}

export function getVnPayAttempt(
  bookingId: string,
): PersistedVnPayAttempt | null {
  const attempt = readStorage<PersistedVnPayAttempt>(
    vnPayStorageKey(bookingId),
  )

  if (isPersistedVnPayAttempt(attempt, bookingId)) {
    return attempt
  }

  removeStorage(vnPayStorageKey(bookingId))
  return null
}

export function getOrCreateVnPayAttempt(
  bookingId: string,
): PersistedVnPayAttempt {
  const storageKey = vnPayStorageKey(bookingId)
  const existing = getVnPayAttempt(bookingId)

  if (existing) {
    writeStorage(currentVnPayStorageKey, existing)
    return existing
  }

  const attempt: PersistedVnPayAttempt = {
    bookingId,
    createdAt: Date.now(),
    idempotencyKey: createKey('vnpay'),
  }

  writeStorage(storageKey, attempt)
  writeStorage(currentVnPayStorageKey, attempt)
  return attempt
}

export function rememberVnPayPayment(
  attempt: PersistedVnPayAttempt,
  paymentId: string,
) {
  const next = { ...attempt, paymentId }
  writeStorage(vnPayStorageKey(attempt.bookingId), next)
  writeStorage(currentVnPayStorageKey, next)
  return next
}

export function getCurrentVnPayAttempt() {
  const attempt = readStorage<PersistedVnPayAttempt>(
    currentVnPayStorageKey,
  )

  if (isPersistedVnPayAttempt(attempt)) {
    return attempt
  }

  removeStorage(currentVnPayStorageKey)
  return null
}

export function clearVnPayAttempt(bookingId: string) {
  const current = getCurrentVnPayAttempt()
  removeStorage(vnPayStorageKey(bookingId))

  if (current?.bookingId === bookingId) {
    removeStorage(currentVnPayStorageKey)
  }
}

function manualStorageKey(
  bookingId: string,
  method: PersistedManualAttempt['method'],
) {
  return `${STORAGE_PREFIX}:manual:${bookingId}:${method}`
}

export function getOrCreateManualPaymentKey(
  bookingId: string,
  method: PersistedManualAttempt['method'],
) {
  const storageKey = manualStorageKey(bookingId, method)
  const existing = readStorage<PersistedManualAttempt>(storageKey)

  if (
    existing?.bookingId === bookingId &&
    existing.method === method &&
    typeof existing.idempotencyKey === 'string' &&
    fresh(existing.createdAt)
  ) {
    return existing.idempotencyKey
  }

  const attempt: PersistedManualAttempt = {
    bookingId,
    createdAt: Date.now(),
    idempotencyKey: createKey('manual'),
    method,
  }

  writeStorage(storageKey, attempt)
  return attempt.idempotencyKey
}

export function clearManualPaymentKey(
  bookingId: string,
  method: PersistedManualAttempt['method'],
) {
  removeStorage(manualStorageKey(bookingId, method))
}

function refundStorageKey(paymentId: string) {
  return `${STORAGE_PREFIX}:refund:${paymentId}`
}

export function getOrCreateRefundPaymentKey(paymentId: string) {
  const storageKey = refundStorageKey(paymentId)
  const existing = readStorage<PersistedRefundAttempt>(storageKey)

  if (
    existing?.paymentId === paymentId &&
    typeof existing.idempotencyKey === 'string' &&
    fresh(existing.createdAt)
  ) {
    return existing.idempotencyKey
  }

  const attempt: PersistedRefundAttempt = {
    createdAt: Date.now(),
    idempotencyKey: `${createKey('refund')}-${paymentId}`.slice(0, 100),
    paymentId,
  }

  writeStorage(storageKey, attempt)
  return attempt.idempotencyKey
}

export function clearRefundPaymentKey(paymentId: string) {
  removeStorage(refundStorageKey(paymentId))
}
