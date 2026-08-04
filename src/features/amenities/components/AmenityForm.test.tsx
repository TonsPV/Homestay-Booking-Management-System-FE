import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AmenityForm } from './AmenityForm'

describe('AmenityForm', () => {
  it('keeps the cancel button as a non-submit button and submits from the primary action', async () => {
    const onCancel = vi.fn()
    const onSubmit = vi.fn()

    render(<AmenityForm onCancel={onCancel} onSubmit={onSubmit} />)

    expect(screen.getByRole('button', { name: 'Hủy' })).toHaveAttribute(
      'type',
      'button',
    )
    expect(
      screen.getByRole('button', { name: 'Tạo tiện nghi' }),
    ).toHaveAttribute('type', 'submit')

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox', { name: /Tên tiện nghi/ }), {
      target: { value: 'Wi-Fi' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tiện nghi' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        description: null,
        name: 'Wi-Fi',
      })
    })
  })
})