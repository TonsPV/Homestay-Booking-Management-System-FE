import { describe, expect, it } from 'vitest'

import { formatBedConfiguration } from './bed-configuration'

describe('formatBedConfiguration', () => {
  it('formats normalized beds with Vietnamese labels', () => {
    expect(
      formatBedConfiguration([
        { type: 'DOUBLE', quantity: 1 },
        { type: 'SINGLE', quantity: 2 },
      ]),
    ).toBe('1 Giường đôi · 2 Giường đơn')
  })

  it('drops invalid records without guessing', () => {
    expect(
      formatBedConfiguration([
        { type: 'DOUBLE', quantity: 0 },
        { type: 'SINGLE', quantity: 1 },
      ]),
    ).toBe('1 Giường đơn')
    expect(formatBedConfiguration([{ type: 'DOUBLE', quantity: 0 }])).toBeNull()
  })

  it('falls back to legacy only when normalized beds are empty', () => {
    expect(formatBedConfiguration([], '1 giường đôi')).toBe('1 giường đôi')
    expect(
      formatBedConfiguration([{ type: 'SINGLE', quantity: 1 }], 'legacy'),
    ).toBe('1 Giường đơn')
  })
})
