import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearManualPaymentKey,
  clearRefundPaymentKey,
  clearVnPayAttempt,
  getCurrentVnPayAttempt,
  getOrCreateManualPaymentKey,
  getOrCreateRefundPaymentKey,
  getOrCreateVnPayAttempt,
  getVnPayAttempt,
  rememberVnPayPayment,
} from './idempotency'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-26T00:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('payment idempotency storage', () => {
  it('reuses a manual key for retries of the same booking and method', () => {
    const first = getOrCreateManualPaymentKey('12', 'CASH')
    const retry = getOrCreateManualPaymentKey('12', 'CASH')
    const otherMethod = getOrCreateManualPaymentKey(
      '12',
      'BANK_TRANSFER',
    )

    expect(retry).toBe(first)
    expect(otherMethod).not.toBe(first)
    expect(first).toMatch(/^manual-/)
  })

  it('creates a new manual key only after an explicit clear', () => {
    const first = getOrCreateManualPaymentKey('12', 'CASH')

    clearManualPaymentKey('12', 'CASH')

    expect(getOrCreateManualPaymentKey('12', 'CASH')).not.toBe(first)
  })

  it('reuses a refund key for timeout retries until explicitly cleared', () => {
    const first = getOrCreateRefundPaymentKey('32')

    expect(getOrCreateRefundPaymentKey('32')).toBe(first)
    expect(getOrCreateRefundPaymentKey('33')).not.toBe(first)
    expect(first).toMatch(/^refund-/)

    clearRefundPaymentKey('32')

    expect(getOrCreateRefundPaymentKey('32')).not.toBe(first)
  })

  it('persists one VNPay attempt through payment creation and return', () => {
    const first = getOrCreateVnPayAttempt('12')
    const retry = getOrCreateVnPayAttempt('12')
    const remembered = rememberVnPayPayment(first, '31')

    expect(retry.idempotencyKey).toBe(first.idempotencyKey)
    expect(getVnPayAttempt('12')).toEqual(remembered)
    expect(getCurrentVnPayAttempt()).toEqual(remembered)

    clearVnPayAttempt('12')

    expect(getVnPayAttempt('12')).toBeNull()
    expect(getCurrentVnPayAttempt()).toBeNull()
  })
})
