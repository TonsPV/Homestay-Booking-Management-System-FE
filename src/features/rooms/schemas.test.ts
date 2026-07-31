import { describe, expect, it } from 'vitest'

import {
  ROOM_IMAGE_MAX_FILE_SIZE,
  roomBlockFormSchema,
  roomCalendarRangeFormSchema,
  roomImageFormSchema,
  roomSearchFormSchema,
} from './schemas'

function parseFile(file: File) {
  return roomImageFormSchema.safeParse({
    file,
    isCover: false,
    sortOrder: '0',
  })
}

describe('room image upload validation', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])(
    'accepts %s files within the size limit',
    (type) => {
      expect(
        parseFile(new File(['image'], 'room-image', { type })).success,
      ).toBe(true)
    },
  )

  it('rejects unsupported image formats', () => {
    const result = parseFile(
      new File(['<svg/>'], 'room.svg', { type: 'image/svg+xml' }),
    )

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.',
    )
  })

  it('rejects files larger than 8 MiB', () => {
    const result = parseFile(
      new File(
        [new Uint8Array(ROOM_IMAGE_MAX_FILE_SIZE + 1)],
        'large-room.png',
        { type: 'image/png' },
      ),
    )

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.some((issue) =>
        issue.message.includes('8 MiB'),
      ),
    ).toBe(true)
  })

  it('accepts a file exactly at the 8 MiB limit', () => {
    expect(
      parseFile(
        new File(
          [new Uint8Array(ROOM_IMAGE_MAX_FILE_SIZE)],
          'room.png',
          { type: 'image/png' },
        ),
      ).success,
    ).toBe(true)
  })

  it('requires a file and a non-negative integer sort order', () => {
    const missingFile = roomImageFormSchema.safeParse({
      file: undefined,
      isCover: false,
      sortOrder: '0',
    })
    const invalidSortOrders = ['-1', '1.5', '2147483648']

    expect(missingFile.success).toBe(false)

    for (const sortOrder of invalidSortOrders) {
      expect(
        roomImageFormSchema.safeParse({
          file: new File(['image'], 'room.png', {
            type: 'image/png',
          }),
          isCover: false,
          sortOrder,
        }).success,
      ).toBe(false)
    }
  })
})

describe('room calendar range validation', () => {
  it('accepts a valid half-open range and block reason', () => {
    expect(
      roomCalendarRangeFormSchema.safeParse({
        from: '2026-08-01',
        to: '2026-08-03',
      }).success,
    ).toBe(true)
    expect(
      roomBlockFormSchema.safeParse({
        from: '2026-08-01',
        to: '2026-08-03',
        reason: '  Bảo trì máy lạnh  ',
      }).success,
    ).toBe(true)
  })

  it.each([
    ['same day', '2026-08-01', '2026-08-01'],
    ['reversed', '2026-08-03', '2026-08-01'],
    ['over 366 days', '2026-01-01', '2027-01-03'],
    ['invalid date', '2026-02-30', '2026-03-02'],
  ])('rejects a %s range', (_caseName, from, to) => {
    expect(
      roomCalendarRangeFormSchema.safeParse({ from, to }).success,
    ).toBe(false)
  })

  it('requires a non-empty reason no longer than 500 characters', () => {
    const range = { from: '2026-08-01', to: '2026-08-03' }

    expect(
      roomBlockFormSchema.safeParse({ ...range, reason: '   ' }).success,
    ).toBe(false)
    expect(
      roomBlockFormSchema.safeParse({
        ...range,
        reason: 'x'.repeat(501),
      }).success,
    ).toBe(false)
  })
})

describe('room search amenity validation', () => {
  const validSearch = {
    amenityIds: ['1', '2'],
    checkIn: '2026-08-01',
    checkOut: '2026-08-03',
    guests: '2',
    maxPrice: '',
    minPrice: '',
    roomTypeId: '',
  }

  it('accepts selected amenity IDs', () => {
    expect(roomSearchFormSchema.safeParse(validSearch).success).toBe(true)
  })

  it('rejects invalid IDs and more than 20 selections', () => {
    expect(
      roomSearchFormSchema.safeParse({
        ...validSearch,
        amenityIds: ['wifi'],
      }).success,
    ).toBe(false)
    expect(
      roomSearchFormSchema.safeParse({
        ...validSearch,
        amenityIds: Array.from({ length: 21 }, (_, index) =>
          String(index + 1),
        ),
      }).success,
    ).toBe(false)
  })
})
