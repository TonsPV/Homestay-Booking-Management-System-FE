import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearDuplicateResolutionKey,
  clearManualPaymentKey,
  clearRefundPaymentKey,
  clearVnPayAttempt,
  getCurrentVnPayAttempt,
  getOrCreateDuplicateResolutionKey,
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

  it('reuses one duplicate-resolution key for the same logical attempt', () => {
    const first = getOrCreateDuplicateResolutionKey('95')

    // Re-renders and dialog retries must not mint a new key.
    expect(getOrCreateDuplicateResolutionKey('95')).toBe(first)
    expect(getOrCreateDuplicateResolutionKey('96')).not.toBe(first)
    expect(first).toMatch(/^duplicate-/)

    // Backend enforces 8-100 chars of [A-Za-z0-9._:-], first char alnum.
    expect(first).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/)
    expect(first.length).toBeLessThanOrEqual(100)

    clearDuplicateResolutionKey('95')

    expect(getOrCreateDuplicateResolutionKey('95')).not.toBe(first)
  })

  it('keeps duplicate-resolution keys separate from refund keys', () => {
    const duplicateKey = getOrCreateDuplicateResolutionKey('95')
    const refundKey = getOrCreateRefundPaymentKey('95')

    expect(duplicateKey).not.toBe(refundKey)
  })
})
