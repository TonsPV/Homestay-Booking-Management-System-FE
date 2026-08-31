import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearBookingIntent,
  getOrCreateBookingIntentKey,
  quarantineBookingIntent,
  resetBookingIntentMemoryForTests,
} from './idempotency'
import type {
  CreateBookingInput,
  CreateManagementBookingInput,
} from './types'

const customerA = 'customer-a-id'
const customerB = 'customer-b-id'
const userA = 'user-a-id'
const userB = 'user-b-id'

const input: CreateBookingInput = {
  checkInDate: '2026-09-10',
  checkOutDate: '2026-09-12',
  guestCount: 2,
  roomId: '12',
}

beforeEach(() => {
  localStorage.clear()
  resetBookingIntentMemoryForTests()
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('booking request-intent storage', () => {
  it('reuses one key for the same customer actor and semantic payload', () => {
    const first = getOrCreateBookingIntentKey('customer', customerA, input)
    const retry = getOrCreateBookingIntentKey('customer', customerA, {
      guestCount: 2,
      roomId: '12',
      checkOutDate: '2026-09-12',
      checkInDate: '2026-09-10',
    })

    expect(retry).toBe(first)
    expect(first).toMatch(/^booking-customer-/)
    expect(first.length).toBeLessThanOrEqual(100)
  })

  it('isolates Customer A/B/A while preserving A retry identity', () => {
    const keyA = getOrCreateBookingIntentKey('customer', customerA, input)
    const keyB = getOrCreateBookingIntentKey('customer', customerB, input)

    expect(keyB).not.toBe(keyA)
    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).toBe(keyA)
  })

  it('isolates Management A/B/A while preserving A retry identity', () => {
    const keyA = getOrCreateBookingIntentKey('management', userA, input)
    const keyB = getOrCreateBookingIntentKey('management', userB, input)

    expect(keyB).not.toBe(keyA)
    expect(
      getOrCreateBookingIntentKey('management', userA, input),
    ).toBe(keyA)
  })

  it('matches Backend normalization for semantic contact and note fields', () => {
    const first = getOrCreateBookingIntentKey('management', userA, {
      ...input,
      contactName: '  Nguyễn Văn A  ',
      contactPhone: '0901 234 567',
      contactEmail: 'GUEST@EXAMPLE.COM',
      customerNote: undefined,
    })
    const retry = getOrCreateBookingIntentKey('management', userA, {
      ...input,
      contactName: 'Nguyễn Văn A',
      contactPhone: '+84 901-234-567',
      contactEmail: 'guest@example.com',
      customerNote: null,
    })

    expect(retry).toBe(first)
  })

  it('preserves payload A across an interleaved A → B → A flow', () => {
    const payloadB = { ...input, guestCount: 3 }
    const keyA = getOrCreateBookingIntentKey('customer', customerA, input)
    resetBookingIntentMemoryForTests()
    const keyB = getOrCreateBookingIntentKey(
      'customer',
      customerA,
      payloadB,
    )
    resetBookingIntentMemoryForTests()

    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).toBe(keyA)
    expect(
      getOrCreateBookingIntentKey('customer', customerA, payloadB),
    ).toBe(keyB)
    expect(keyB).not.toBe(keyA)
  })

  it('preserves management payloads across an interleaved retry', () => {
    const payloadA: CreateManagementBookingInput = {
      ...input,
      contactName: 'Nguyễn Văn A',
      contactPhone: '0901234567',
    }
    const payloadB = { ...payloadA, roomId: '13' }
    const keyA = getOrCreateBookingIntentKey(
      'management',
      userA,
      payloadA,
    )
    const keyB = getOrCreateBookingIntentKey(
      'management',
      userA,
      payloadB,
    )

    expect(
      getOrCreateBookingIntentKey('management', userA, payloadA),
    ).toBe(keyA)
    expect(
      getOrCreateBookingIntentKey('management', userA, payloadB),
    ).toBe(keyB)
  })

  it('keeps customer and management actor namespaces separate', () => {
    const customer = getOrCreateBookingIntentKey(
      'customer',
      'same-id',
      input,
    )
    const management = getOrCreateBookingIntentKey(
      'management',
      'same-id',
      input,
    )

    expect(management).not.toBe(customer)
    expect(management).toMatch(/^booking-management-/)
  })

  it('does not bind an actor-less v1 intent to the current customer', () => {
    const legacyKey = 'booking-customer-legacy-key'
    localStorage.setItem(
      'hbms:bookings:create:customer',
      JSON.stringify({
        createdAt: Date.now(),
        fingerprint: JSON.stringify({
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          guestCount: input.guestCount,
          roomId: input.roomId,
        }),
        idempotencyKey: legacyKey,
      }),
    )

    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).not.toBe(legacyKey)
    expect(localStorage.getItem('hbms:bookings:create:customer')).toBeNull()
  })

  it('does not bind an actor-less v2 intent to the current customer', () => {
    const semanticFingerprint = JSON.stringify({
      input: {
        roomId: '12',
        checkInDate: '2026-09-10',
        checkOutDate: '2026-09-12',
        nights: 2,
        guestCount: 2,
        customerNote: null,
      },
    })
    const storageKey = `hbms:bookings:create:v2:customer:${encodeURIComponent(semanticFingerprint)}`
    const legacyKey = 'booking-customer-v2-key'
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        createdAt: Date.now(),
        fingerprint: semanticFingerprint,
        idempotencyKey: legacyKey,
      }),
    )

    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).not.toBe(legacyKey)
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it('clears actor B success without clearing actor A pending intent', () => {
    const keyA = getOrCreateBookingIntentKey('customer', customerA, input)
    const keyB = getOrCreateBookingIntentKey('customer', customerB, input)

    clearBookingIntent('customer', customerB, input)

    expect(
      getOrCreateBookingIntentKey('customer', customerB, input),
    ).not.toBe(keyB)
    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).toBe(keyA)
  })

  it('quarantines actor B conflict without touching actor A intent', () => {
    const keyA = getOrCreateBookingIntentKey('customer', customerA, input)
    const keyB = getOrCreateBookingIntentKey('customer', customerB, input)

    quarantineBookingIntent('customer', customerB, input)

    expect(
      getOrCreateBookingIntentKey('customer', customerB, input),
    ).not.toBe(keyB)
    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).toBe(keyA)
  })

  it('clears management actor B success without clearing actor A pending intent', () => {
    const keyA = getOrCreateBookingIntentKey('management', userA, input)
    const keyB = getOrCreateBookingIntentKey('management', userB, input)

    clearBookingIntent('management', userB, input)

    expect(
      getOrCreateBookingIntentKey('management', userB, input),
    ).not.toBe(keyB)
    expect(
      getOrCreateBookingIntentKey('management', userA, input),
    ).toBe(keyA)
  })

  it('quarantines management actor B without touching actor A intent', () => {
    const keyA = getOrCreateBookingIntentKey('management', userA, input)
    const keyB = getOrCreateBookingIntentKey('management', userB, input)

    quarantineBookingIntent('management', userB, input)

    expect(
      getOrCreateBookingIntentKey('management', userB, input),
    ).not.toBe(keyB)
    expect(
      getOrCreateBookingIntentKey('management', userA, input),
    ).toBe(keyA)
  })

  it('clears only one semantic payload for one actor', () => {
    const first = getOrCreateBookingIntentKey('customer', customerA, input)
    const changedInput = { ...input, guestCount: 3 }
    const changed = getOrCreateBookingIntentKey(
      'customer',
      customerA,
      changedInput,
    )

    clearBookingIntent('customer', customerA, input)

    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).not.toBe(first)
    expect(
      getOrCreateBookingIntentKey('customer', customerA, changedInput),
    ).toBe(changed)
  })

  it('uses the same actor-scoped in-memory key when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError')
    })

    const first = getOrCreateBookingIntentKey('customer', customerA, input)
    const retry = getOrCreateBookingIntentKey('customer', customerA, input)

    expect(retry).toBe(first)
  })

  it('never rotates an unresolved key because wall-clock time elapsed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'))
    const first = getOrCreateBookingIntentKey('customer', customerA, input)

    vi.setSystemTime(new Date('2026-10-01T00:00:00.000Z'))
    resetBookingIntentMemoryForTests()

    expect(
      getOrCreateBookingIntentKey('customer', customerA, input),
    ).toBe(first)
  })
})
