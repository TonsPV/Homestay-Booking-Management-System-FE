import { describe, expect, it } from 'vitest'

import { roomTypeFormSchema, roomTypeMoneySchema } from './schemas'

describe('RoomType form validation', () => {
  it.each(['0', '1250000', '1250000.5', '1250000.50'])(
    'keeps valid money %s as a decimal string',
    (basePrice) => {
      const result = roomTypeMoneySchema.safeParse(basePrice)

      expect(result.success).toBe(true)
      expect(result.data).toBe(basePrice)
    },
  )

  it.each(['-1', '1.234', '01', '10000000000', '1e6'])(
    'rejects invalid money %s',
    (basePrice) => {
      expect(roomTypeMoneySchema.safeParse(basePrice).success).toBe(false)
    },
  )

  it('validates name, guest count and description limits', () => {
    expect(
      roomTypeFormSchema.safeParse({
        basePrice: '850000.00',
        description: 'Phòng dành cho gia đình.',
        maxGuests: '4',
        name: 'Phòng gia đình',
      }).success,
    ).toBe(true)

    expect(
      roomTypeFormSchema.safeParse({
        basePrice: '850000.00',
        description: 'x'.repeat(10_001),
        maxGuests: '0',
        name: '',
      }).success,
    ).toBe(false)
  })
})
