import { describe, expect, it } from 'vitest'

import { isRuntimeUrlSecure, resolveApiOrigin } from './config'

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
    'https://localhost:3000',
  ])('rejects loopback endpoints in production: %s', (value) => {
    expect(isRuntimeUrlSecure(new URL(value), true)).toBe(false)
  })

  it('allows remote HTTP during development', () => {
    expect(
      isRuntimeUrlSecure(new URL('http://api.test'), false),
    ).toBe(true)
  })
})

describe('resolveApiOrigin', () => {
  it('falls back to localhost during development when unset', () => {
    expect(resolveApiOrigin({ configuredOrigin: '', production: false })).toBe(
      'http://localhost:3000',
    )
  })

  it('fails fast when production has no API origin', () => {
    expect(() =>
      resolveApiOrigin({ configuredOrigin: '', production: true }),
    ).toThrow('VITE_API_ORIGIN is required in production.')
  })

  it('rejects public HTTP in production', () => {
    expect(() =>
      resolveApiOrigin({
        configuredOrigin: 'http://api.example.com',
        production: true,
      }),
    ).toThrow('VITE_API_ORIGIN must use HTTPS in production.')
  })

  it('accepts HTTPS origins and normalizes trailing slashes', () => {
    expect(
      resolveApiOrigin({
        configuredOrigin: 'https://api.example.com///',
        production: true,
      }),
    ).toBe('https://api.example.com')
  })

  it.each([
    'https://api.example.com/api',
    'https://api.example.com?tenant=one',
    'https://api.example.com#fragment',
  ])('rejects an origin with path/query/fragment: %s', (configuredOrigin) => {
    expect(() =>
      resolveApiOrigin({ configuredOrigin, production: true }),
    ).toThrow(
      'VITE_API_ORIGIN must be an origin without a path, query, or fragment.',
    )
  })
})
