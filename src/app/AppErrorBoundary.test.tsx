import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from './AppErrorBoundary'
import { reportRuntimeError } from './error-reporting'

vi.mock('./error-reporting', () => ({
  reportRuntimeError: vi.fn(),
}))

function BrokenSurface(): never {
  throw new Error('Render failed')
}

let shouldRecover = false

function FlakySurface() {
  if (!shouldRecover) {
    throw new Error('Render failed')
  }

  return <h2>Đã khôi phục</h2>
}

afterEach(() => {
  vi.mocked(reportRuntimeError).mockReset()
  vi.restoreAllMocks()
})

describe('AppErrorBoundary', () => {
  it('reports the runtime error and focuses a recoverable fallback', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <AppErrorBoundary>
        <BrokenSurface />
      </AppErrorBoundary>,
    )

    const heading = screen.getByRole('heading', {
      name: 'Trang không thể hiển thị',
    })

    await waitFor(() => expect(heading).toHaveFocus())
    expect(reportRuntimeError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Render failed' }),
      'react-boundary',
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Thử lại' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Về trang chủ' }),
    ).toHaveAttribute('href', '/')
  })

  it('resets the boundary without a full page reload when retry is clicked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    shouldRecover = false

    render(
      <AppErrorBoundary>
        <FlakySurface />
      </AppErrorBoundary>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Trang không thể hiển thị',
      }),
    ).toBeInTheDocument()

    shouldRecover = true
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Đã khôi phục' }),
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByRole('heading', {
        name: 'Trang không thể hiển thị',
      }),
    ).not.toBeInTheDocument()
  })
})
