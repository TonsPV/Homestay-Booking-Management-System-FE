import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { X } from 'lucide-react'

import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('requires an aria-label and exposes it as the accessible name', () => {
    render(
      <IconButton aria-label="Đóng menu">
        <X aria-hidden className="size-4" />
      </IconButton>,
    )

    expect(screen.getByRole('button', { name: 'Đóng menu' })).toBeInTheDocument()
  })

  it('applies ghost variant and md size by default', () => {
    render(<IconButton aria-label="Menu" />)
    const button = screen.getByRole('button', { name: 'Menu' })

    expect(button.className).toContain('bg-transparent')
    expect(button.className).toContain('hover:bg-surface-muted')
    expect(button.className).toContain('size-11')
    expect(button.className).toContain('rounded-full')
  })

  it('supports outline and inverse-ghost variants plus sm size', () => {
    const { rerender } = render(
      <IconButton aria-label="Đóng" size="sm" variant="outline" />,
    )
    let button = screen.getByRole('button', { name: 'Đóng' })

    expect(button.className).toContain('border')
    expect(button.className).toContain('border-line')
    expect(button.className).toContain('size-9')

    rerender(<IconButton aria-label="Đóng" variant="inverse-ghost" />)
    button = screen.getByRole('button', { name: 'Đóng' })

    expect(button.className).toContain('text-on-inverse-muted')
    expect(button.className).toContain('hover:bg-inverse-raised')
  })

  it('shows a spinner and busy state when loading', () => {
    render(<IconButton aria-label="Đang tải" loading />)
    const button = screen.getByRole('button', { name: 'Đang tải' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })

  it('keeps children visible but disabled when disabled prop is set', () => {
    const onClick = vi.fn()
    render(
      <IconButton aria-label="Xóa" disabled onClick={onClick}>
        <X aria-hidden className="size-4" />
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Xóa' })

    expect(button).toBeDisabled()
    expect(button.className).toContain('disabled:cursor-not-allowed')
    expect(button.className).toContain('disabled:opacity-55')

    button.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('handles keyboard and pointer interaction when enabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<IconButton aria-label="Bật menu" onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Bật menu' })

    button.focus()
    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(1)

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('merges custom className for layout-specific positioning', () => {
    render(<IconButton aria-label="Cài đặt" className="absolute right-3 top-3" />)

    expect(screen.getByRole('button', { name: 'Cài đặt' }).className).toContain(
      'absolute',
    )
  })
})
