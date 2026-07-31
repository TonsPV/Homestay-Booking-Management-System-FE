import { describe, expect, it } from 'vitest'

import { amenityFormSchema } from './schemas'

describe('amenity form validation', () => {
  it('accepts a trimmed valid amenity', () => {
    const result = amenityFormSchema.safeParse({
      description: ' Kết nối tốc độ cao ',
      name: ' Wi-Fi ',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      description: 'Kết nối tốc độ cao',
      name: 'Wi-Fi',
    })
  })

  it('rejects an empty name and oversized fields', () => {
    expect(
      amenityFormSchema.safeParse({ description: '', name: '   ' }).success,
    ).toBe(false)
    expect(
      amenityFormSchema.safeParse({
        description: 'x'.repeat(501),
        name: 'x'.repeat(121),
      }).success,
    ).toBe(false)
  })
})
