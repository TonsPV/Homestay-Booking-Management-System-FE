import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Field, Input } from './FormControls'

describe('Field', () => {
  it('exposes required semantics and preserves an existing description', () => {
    render(
      <Field hint="Dùng tên trên giấy tờ." label="Họ và tên" required>
        <Input aria-describedby="external-description" />
      </Field>,
    )

    const input = screen.getByLabelText(/Họ và tên/)
    const hint = screen.getByText('Dùng tên trên giấy tờ.')

    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute(
      'aria-describedby',
      `external-description ${hint.id}`,
    )
  })

  it('marks an invalid control while retaining its original invalid state', () => {
    const { rerender } = render(
      <Field error="Vui lòng nhập họ tên." label="Họ và tên">
        <Input />
      </Field>,
    )

    expect(screen.getByLabelText('Họ và tên')).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    rerender(
      <Field label="Họ và tên">
        <Input aria-invalid />
      </Field>,
    )

    expect(screen.getByLabelText('Họ và tên')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})
