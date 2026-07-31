import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema } from './validation'

describe('auth form validation', () => {
  it('trims a valid login identifier and keeps the password intact', () => {
    expect(
      loginSchema.parse({
        identifier: '  guest@example.com  ',
        password: ' password123 ',
        remember: true,
      }),
    ).toEqual({
      identifier: 'guest@example.com',
      password: ' password123 ',
      remember: true,
    })
  })

  it.each([
    { identifier: '', password: 'password123', remember: false },
    { identifier: 'guest@example.com', password: '', remember: false },
    { identifier: 'guest@example.com', password: '   ', remember: false },
  ])('rejects an incomplete login payload %#', (input) => {
    expect(loginSchema.safeParse(input).success).toBe(false)
  })

  it('accepts a valid customer registration payload', () => {
    expect(
      registerSchema.safeParse({
        confirmPassword: 'password123',
        email: 'guest@example.com',
        fullName: 'Nguyễn Văn An',
        password: 'password123',
        phone: '090 123 4567',
      }).success,
    ).toBe(true)
  })

  it.each([
    {
      confirmPassword: 'different123',
      email: 'guest@example.com',
      fullName: 'Nguyễn Văn An',
      password: 'password123',
      phone: '0901234567',
    },
    {
      confirmPassword: 'password123',
      email: 'invalid-email',
      fullName: 'Nguyễn Văn An',
      password: 'password123',
      phone: '0901234567',
    },
    {
      confirmPassword: 'password123',
      email: '',
      fullName: '',
      password: 'password123',
      phone: '0123456789',
    },
    {
      confirmPassword: 'short',
      email: '',
      fullName: 'Nguyễn Văn An',
      password: 'short',
      phone: '0901234567',
    },
  ])('rejects an invalid registration payload %#', (input) => {
    expect(registerSchema.safeParse(input).success).toBe(false)
  })
})
