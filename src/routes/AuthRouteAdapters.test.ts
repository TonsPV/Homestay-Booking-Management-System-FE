import { describe, expect, it } from 'vitest'

import { getSafeReturnTo } from './return-to'

describe('getSafeReturnTo', () => {
  it('accepts only same-origin application paths', () => {
    expect(getSafeReturnTo({ returnTo: '/bookings/12?tab=payment' }, '/')).toBe(
      '/bookings/12?tab=payment',
    )
  })

  it.each([
    null,
    {},
    { returnTo: 'https://attacker.example' },
    { returnTo: '//attacker.example/path' },
    { returnTo: 42 },
  ])('rejects an unsafe return target %#', (state) => {
    expect(getSafeReturnTo(state, '/account')).toBe('/account')
  })
})
