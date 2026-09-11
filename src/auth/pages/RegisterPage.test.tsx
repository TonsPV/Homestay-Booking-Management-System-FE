import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { RegisterPage } from './RegisterPage'

const registerCustomerMock = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  registerCustomer: registerCustomerMock,
}))

function renderRegisterPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage loginPath="/login" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  it('shows a pending state and blocks duplicate submits', async () => {
    registerCustomerMock.mockReturnValue(new Promise(() => {}))

    renderRegisterPage()

    fireEvent.change(screen.getByRole('textbox', { name: /Họ và tên/ }), {
      target: { value: 'Nguyễn Văn An' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /Số điện thoại/ }), {
      target: { value: '0901234567' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /Email/ }), {
      target: { value: 'guest@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/), {
      target: { value: 'password123' },
    })

    const form = screen.getByRole('button', { name: 'Tạo tài khoản' }).closest('form')
    expect(form).not.toBeNull()

    fireEvent.submit(form!)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Đang đăng ký...' }),
      ).toBeDisabled()
    })

    fireEvent.submit(form!)
    expect(registerCustomerMock).toHaveBeenCalledTimes(1)
  })

  it('exposes accessible labels and error descriptions', async () => {
    renderRegisterPage()

    expect(screen.getByRole('textbox', { name: /Họ và tên/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Số điện thoại/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Xác nhận mật khẩu/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))

    const nameError = await screen.findByText('Vui lòng nhập họ và tên.')
    const phoneError = screen.getByText('Vui lòng nhập số điện thoại.')
    const passwordError = screen.getByText('Mật khẩu phải có ít nhất 8 ký tự.')

    expect(screen.getByRole('textbox', { name: /Họ và tên/ })).toHaveAttribute(
      'aria-describedby',
      nameError.id,
    )
    expect(screen.getByRole('textbox', { name: /Số điện thoại/ })).toHaveAttribute(
      'aria-describedby',
      phoneError.id,
    )
    expect(screen.getByLabelText(/Mật khẩu/)).toHaveAttribute(
      'aria-describedby',
      passwordError.id,
    )
  })

  it('lets a guest show and hide either password field repeatedly', () => {
    renderRegisterPage()

    const password = screen.getByLabelText(/^Mật khẩu/)
    const confirmation = screen.getByLabelText(/^Xác nhận mật khẩu/)
    const toggles = screen.getAllByRole('button', { name: 'Hiện mật khẩu' })

    fireEvent.click(toggles[0]!)
    expect(password).toHaveAttribute('type', 'text')
    expect(confirmation).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(password).toHaveAttribute('type', 'password')
    expect(
      screen.getAllByRole('button', { name: 'Hiện mật khẩu' }),
    ).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Hiện mật khẩu' })[1]!)
    expect(confirmation).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }))
    expect(confirmation).toHaveAttribute('type', 'password')
    expect(
      screen.getAllByRole('button', { name: 'Hiện mật khẩu' }),
    ).toHaveLength(2)
  })
})
