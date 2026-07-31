import {
  describe,
  expect,
  it,
} from 'vitest'

import type { PersistedVnPayAttempt } from './idempotency'
import {
  decideVnPayAttempt,
  getBoundedPaymentPollingInterval,
} from './safety'

const storedAttempt: PersistedVnPayAttempt = {
  bookingId: '21',
  createdAt: 1,
  idempotencyKey: 'vnpay-attempt-001',
  paymentId: '101',
}

describe('decideVnPayAttempt', () => {
  it('blocks a pending payment when this device has no matching key', () => {
    expect(
      decideVnPayAttempt(
        '21',
        [{ id: '101', method: 'VNPAY', status: 'PENDING' }],
        null,
      ),
    ).toEqual({
      kind: 'blocked',
      paymentId: '101',
      reason: 'pending-without-key',
    })
  })

  it('replays the saved key for its matching pending payment', () => {
    expect(
      decideVnPayAttempt(
        '21',
        [{ id: '101', method: 'VNPAY', status: 'PENDING' }],
        storedAttempt,
      ),
    ).toEqual({ attempt: storedAttempt, kind: 'replay' })
  })

  it('replays an ambiguous saved key without creating a new key', () => {
    const ambiguousAttempt = {
      ...storedAttempt,
      paymentId: undefined,
    }

    expect(
      decideVnPayAttempt(
        '21',
        [{ id: '202', method: 'VNPAY', status: 'PENDING' }],
        ambiguousAttempt,
      ),
    ).toEqual({ attempt: ambiguousAttempt, kind: 'replay' })
  })

  it('blocks when the pending payment belongs to a different attempt', () => {
    expect(
      decideVnPayAttempt(
        '21',
        [{ id: '202', method: 'VNPAY', status: 'PENDING' }],
        storedAttempt,
      ),
    ).toEqual({
      kind: 'blocked',
      paymentId: '202',
      reason: 'pending-without-key',
    })
  })

  it('blocks when a known stored payment is absent from loaded history', () => {
    expect(decideVnPayAttempt('21', [], storedAttempt)).toEqual({
      kind: 'blocked',
      paymentId: '101',
      reason: 'unknown-stored-payment',
    })
  })

  it('clears a terminal stored attempt before starting a new action', () => {
    expect(
      decideVnPayAttempt(
        '21',
        [{ id: '101', method: 'VNPAY', status: 'FAILED' }],
        storedAttempt,
      ),
    ).toEqual({
      clearStoredAttempt: true,
      kind: 'new',
    })
  })
})

describe('getBoundedPaymentPollingInterval', () => {
  it('polls pending state without scheduling beyond the deadline', () => {
    expect(
      getBoundedPaymentPollingInterval(10_000, 'PENDING', 1_000),
    ).toBe(2_000)
    expect(
      getBoundedPaymentPollingInterval(1_100, 'PENDING', 1_000),
    ).toBe(250)
  })

  it('stops at the deadline or any terminal payment status', () => {
    expect(
      getBoundedPaymentPollingInterval(1_000, 'PENDING', 1_000),
    ).toBe(false)
    expect(
      getBoundedPaymentPollingInterval(10_000, 'SUCCESS', 1_000),
    ).toBe(false)
    expect(
      getBoundedPaymentPollingInterval(null, undefined, 1_000),
    ).toBe(false)
  })
})
