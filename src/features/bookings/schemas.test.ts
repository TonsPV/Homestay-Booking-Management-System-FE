import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  cancelBookingFormSchema,
  createBookingFormSchema,
  createManagementBookingFormSchema,
} from './schemas'

const customerBooking = {
  bookingForSomeoneElse: false,
  checkInDate: '2026-07-25',
  checkOutDate: '2026-07-27',
  contactEmail: '',
  contactName: '',
  contactPhone: '',
  customerNote: '',
  guestCount: 2,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-24T05:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createBookingFormSchema', () => {
  it('uses the customer profile by allowing empty overrides by default', () => {
    expect(createBookingFormSchema.safeParse(customerBooking).success).toBe(
      true,
    )
  })

  it('requires contact overrides only when booking for someone else', () => {
    const result = createBookingFormSchema.safeParse({
      ...customerBooking,
      bookingForSomeoneElse: true,
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.map((issue) => issue.path.join('.')),
    ).toEqual(expect.arrayContaining(['contactName', 'contactPhone']))
  })

  it('rejects past, invalid, and reversed stay dates', () => {
    const past = createBookingFormSchema.safeParse({
      ...customerBooking,
      checkInDate: '2026-07-23',
    })
    const invalid = createBookingFormSchema.safeParse({
      ...customerBooking,
      checkInDate: '2026-02-30',
    })
    const reversed = createBookingFormSchema.safeParse({
      ...customerBooking,
      checkOutDate: customerBooking.checkInDate,
    })

    expect(past.success).toBe(false)
    expect(invalid.success).toBe(false)
    expect(reversed.success).toBe(false)
  })

  it('matches Backend limits for stay, guests, contacts, and notes', () => {
    const tooLongStay = createBookingFormSchema.safeParse({
      ...customerBooking,
      checkInDate: '2026-07-25',
      checkOutDate: '2026-10-24',
    })
    const invalidGuestCount = createBookingFormSchema.safeParse({
      ...customerBooking,
      guestCount: 0,
    })
    const invalidContact = createBookingFormSchema.safeParse({
      ...customerBooking,
      bookingForSomeoneElse: true,
      contactEmail: 'not-an-email',
      contactName: 'a'.repeat(121),
      contactPhone: '12345',
    })
    const tooLongNote = createBookingFormSchema.safeParse({
      ...customerBooking,
      customerNote: 'a'.repeat(10_001),
    })

    expect(tooLongStay.success).toBe(false)
    expect(invalidGuestCount.success).toBe(false)
    expect(invalidContact.success).toBe(false)
    expect(tooLongNote.success).toBe(false)
  })
})

describe('createManagementBookingFormSchema', () => {
  it('requires counter contact details when customerId is omitted', () => {
    const result = createManagementBookingFormSchema.safeParse({
      ...customerBooking,
      customerId: '',
      roomId: '12',
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.map((issue) => issue.path.join('.')),
    ).toEqual(expect.arrayContaining(['contactName', 'contactPhone']))
  })
})

describe('cancelBookingFormSchema', () => {
  it('allows an optional reason up to the Backend 500-character limit', () => {
    expect(cancelBookingFormSchema.safeParse({ reason: '' }).success).toBe(
      true,
    )
    expect(
      cancelBookingFormSchema.safeParse({ reason: 'a'.repeat(500) }).success,
    ).toBe(true)
    expect(
      cancelBookingFormSchema.safeParse({ reason: 'a'.repeat(501) }).success,
    ).toBe(false)
  })
})
