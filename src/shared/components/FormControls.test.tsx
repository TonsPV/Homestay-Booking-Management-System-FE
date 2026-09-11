import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Field, Input, PasswordInput } from './FormControls'

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

  it('keeps the password visibility control available after repeated toggles', () => {
    render(
      <Field label="Mật khẩu">
        <PasswordInput defaultValue="mat-khau-an-toan" />
      </Field>,
    )

    const input = screen.getByLabelText('Mật khẩu')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Ẩn mật khẩu' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(input).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('button', { name: 'Hiện mật khẩu' }),
    ).toBeInTheDocument()
  })
})
