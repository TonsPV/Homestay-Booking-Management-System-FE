import { describe, expect, it } from 'vitest'

import {
  formatDateOnly,
  formatDateTime,
  formatMoney,
} from './formatters'

describe('formatMoney', () => {
  it('formats decimal strings without converting them to JavaScript numbers', () => {
    expect(formatMoney('900000.00')).toBe('900.000 ₫')
    expect(formatMoney('9007199254740993000.50')).toBe(
      '9.007.199.254.740.993.000,5 ₫',
    )
  })
})

describe('formatDateOnly', () => {
  it('reorders date-only values without UTC conversion', () => {
    expect(formatDateOnly('2026-08-01')).toBe('01/08/2026')
  })
})

describe('formatDateTime', () => {
  it('formats UTC timestamps in the product timezone', () => {
    expect(formatDateTime('2026-07-23T13:45:00.000Z')).toContain('20:45')
  })
})
