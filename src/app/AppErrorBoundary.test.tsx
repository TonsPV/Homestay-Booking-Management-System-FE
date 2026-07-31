import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppErrorBoundary } from './AppErrorBoundary'
import { reportRuntimeError } from './error-reporting'

vi.mock('./error-reporting', () => ({
  reportRuntimeError: vi.fn(),
}))

function BrokenSurface(): never {
  throw new Error('Render failed')
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
      screen.getByRole('button', { name: 'Tải lại trang' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Về trang chủ' }),
    ).toHaveAttribute('href', '/')
  })
})
