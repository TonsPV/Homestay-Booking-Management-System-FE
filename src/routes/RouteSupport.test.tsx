import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollToTop } from './RouteSupport'

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    document.title = ''
    vi.unstubAllGlobals()
  })

  it('updates the document title and focuses the main landmark', async () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/rooms/search']}>
        <ScrollToTop />
        <main id="main-content" tabIndex={-1}>
          Nội dung
        </main>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(document.title).toBe('Tìm phòng | Homestay Green')
      expect(getByRole('main')).toHaveFocus()
    })
    expect(window.scrollTo).toHaveBeenCalledWith({
      behavior: 'auto',
      left: 0,
      top: 0,
    })
  })
})
