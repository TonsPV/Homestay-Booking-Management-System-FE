import {
  useState,
  type ReactNode,
} from 'react'
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { ConfirmationDialog } from './ConfirmationDialog'

function DialogFixture({
  children,
  onConfirm = vi.fn(),
}: {
  children?: ReactNode
  onConfirm?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Mở xác nhận</Button>
      <ConfirmationDialog
        confirmLabel="Xác nhận"
        description="Kiểm tra dữ liệu trước khi tiếp tục."
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
        open={open}
        title="Xác nhận thao tác"
      >
        {children}
      </ConfirmationDialog>
    </>
  )
}

describe('ConfirmationDialog', () => {
  it('focuses the safe action, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup()
    render(<DialogFixture />)
    const trigger = screen.getByRole('button', { name: 'Mở xác nhận' })

    await user.click(trigger)

    expect(
      screen.getByRole('dialog', { name: 'Xác nhận thao tác' }),
    ).toBeInTheDocument()
    expect(document.body).toHaveStyle({ overflow: 'hidden' })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hủy' })).toHaveFocus()
    })

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  }, 15_000)

  it('keeps keyboard focus inside the dialog', async () => {
    const user = userEvent.setup()
    render(
      <DialogFixture>
        <label htmlFor="confirmation-note">Ghi chú</label>
        <input id="confirmation-note" />
      </DialogFixture>,
    )

    await user.click(screen.getByRole('button', { name: 'Mở xác nhận' }))
    const input = screen.getByRole('textbox', { name: 'Ghi chú' })
    const confirm = screen.getByRole('button', { name: 'Xác nhận' })

    confirm.focus()
    await user.tab()
    expect(input).toHaveFocus()

    input.focus()
    await user.tab({ shift: true })
    expect(confirm).toHaveFocus()
  }, 15_000)

  it('calls the confirm handler without closing implicitly', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DialogFixture onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Mở xác nhận' }))
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  }, 15_000)
})
