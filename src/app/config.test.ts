import { describe, expect, it } from 'vitest'

import { isRuntimeUrlSecure } from './config'

describe('isRuntimeUrlSecure', () => {
  it('requires HTTPS for remote production endpoints', () => {
    expect(
      isRuntimeUrlSecure(new URL('http://api.example.com'), true),
    ).toBe(false)
    expect(
      isRuntimeUrlSecure(new URL('https://api.example.com'), true),
    ).toBe(true)
  })

  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
  ])('allows loopback HTTP in production tooling: %s', (value) => {
    expect(isRuntimeUrlSecure(new URL(value), true)).toBe(true)
  })

  it('allows remote HTTP during development', () => {
    expect(
      isRuntimeUrlSecure(new URL('http://api.test'), false),
    ).toBe(true)
  })
})
