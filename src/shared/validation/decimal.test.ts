import { describe, expect, it } from 'vitest'

import { compareDecimalStrings } from './decimal'

describe('compareDecimalStrings', () => {
  it('compares money without converting to floating point numbers', () => {
    expect(
      compareDecimalStrings('9007199254740993000.01', '9007199254740993000.00'),
    ).toBe(1)
    expect(compareDecimalStrings('1250000.5', '1250000.50')).toBe(0)
    expect(compareDecimalStrings('999.99', '1000')).toBe(-1)
  })
})
