import { describe, expect, it } from 'vitest'

import {
  customerPasswordSchema,
  initialCustomerPasswordSchema,
} from './validation'

describe('customer password validation', () => {
  it('accepts a different password with matching confirmation', () => {
    expect(
      customerPasswordSchema.safeParse({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      }).success,
    ).toBe(true)
  })

  it('rejects a wrong confirmation and a reused password', () => {
    const wrongConfirmation = customerPasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword456!',
      confirmPassword: 'DifferentPassword789!',
    })
    const reusedPassword = customerPasswordSchema.safeParse({
      currentPassword: 'CurrentPassword123!',
      newPassword: 'CurrentPassword123!',
      confirmPassword: 'CurrentPassword123!',
    })

    expect(wrongConfirmation.success).toBe(false)
    expect(
      wrongConfirmation.error?.issues.some(
        (issue) => issue.path[0] === 'confirmPassword',
      ),
    ).toBe(true)
    expect(reusedPassword.success).toBe(false)
    expect(
      reusedPassword.error?.issues.some(
        (issue) => issue.path[0] === 'newPassword',
      ),
    ).toBe(true)
  })

  it.each(['', 'short', ' '.repeat(8), 'x'.repeat(73)])(
    'rejects invalid new password %j',
    (newPassword) => {
      expect(
        customerPasswordSchema.safeParse({
          currentPassword: 'CurrentPassword123!',
          newPassword,
          confirmPassword: newPassword,
        }).success,
      ).toBe(false)
    },
  )
})

describe('initial customer password validation', () => {
  it('requires a valid password and matching confirmation', () => {
    expect(
      initialCustomerPasswordSchema.safeParse({
        confirmPassword: 'InitialPassword123!',
        password: 'InitialPassword123!',
      }).success,
    ).toBe(true)

    const mismatch = initialCustomerPasswordSchema.safeParse({
      confirmPassword: 'DifferentPassword456!',
      password: 'InitialPassword123!',
    })

    expect(mismatch.success).toBe(false)
    expect(
      mismatch.error?.issues.some(
        (issue) => issue.path[0] === 'confirmPassword',
      ),
    ).toBe(true)
  })
})
