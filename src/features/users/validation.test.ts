import { describe, expect, it } from 'vitest'

import { createUserSchema, updateUserSchema } from './validation'

describe('user management validation', () => {
  it('accepts a valid STAFF account form with matching passwords', () => {
    expect(
      createUserSchema.safeParse({
        confirmPassword: 'StaffPassword123!',
        email: 'staff@homestay-green.test',
        fullName: 'Nhân viên kiểm thử',
        password: 'StaffPassword123!',
        phone: '+84901234567',
      }).success,
    ).toBe(true)
  })

  it('rejects mismatched passwords and invalid contact fields', () => {
    const result = createUserSchema.safeParse({
      confirmPassword: 'DifferentPassword456!',
      email: 'invalid-email',
      fullName: '',
      password: 'StaffPassword123!',
      phone: '123',
    })

    expect(result.success).toBe(false)
    expect(
      result.error?.issues.map((issue) => issue.path[0]),
    ).toEqual(
      expect.arrayContaining([
        'confirmPassword',
        'email',
        'fullName',
        'phone',
      ]),
    )
  })

  it('validates editable profile fields without accepting a role field', () => {
    const result = updateUserSchema.safeParse({
      email: 'staff@homestay-green.test',
      fullName: 'Nhân viên kiểm thử',
      password: '',
      phone: '',
      role: 'ADMIN',
    })

    expect(result.success).toBe(true)
    expect(result.data).not.toHaveProperty('role')
  })
})
