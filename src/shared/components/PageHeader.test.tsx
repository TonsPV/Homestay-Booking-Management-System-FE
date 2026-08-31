import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders without breadcrumbs when breadcrumbs are absent or a single item', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PageHeader title="Tổng quan" />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <PageHeader
          breadcrumbs={[{ label: 'Phòng' }]}
          title="Tổng quan"
        />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeInTheDocument()
  })

  it('renders breadcrumb trail with linked parents and current item as plain text', () => {
    render(
      <MemoryRouter>
        <PageHeader
          breadcrumbs={[
            { label: 'Phòng', to: '/management/rooms' },
            { label: 'Phòng 203' },
          ]}
          title="Chỉnh sửa"
        />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const parent = screen.getByRole('link', { name: 'Phòng' })
    const current = screen.getByText('Phòng 203')

    expect(nav).toBeInTheDocument()
    expect(parent).toHaveAttribute('href', '/management/rooms')
    expect(current.tagName).not.toBe('A')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(nav.textContent).toContain('Phòng')
    expect(nav.textContent).toContain('Phòng 203')
  })

  it('renders multi-level trails with a separator between items', () => {
    render(
      <MemoryRouter>
        <PageHeader
          breadcrumbs={[
            { label: 'Phòng', to: '/management/rooms' },
            { label: 'Phòng 203', to: '/management/rooms/203' },
            { label: 'Quản lý ảnh' },
          ]}
          title="Phòng 203"
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Phòng' })).toHaveAttribute(
      'href',
      '/management/rooms',
    )
    expect(screen.getByRole('link', { name: 'Phòng 203' })).toHaveAttribute(
      'href',
      '/management/rooms/203',
    )
    expect(screen.getByText('Quản lý ảnh', { selector: '[aria-current="page"]' })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const separators = nav.querySelectorAll('[aria-hidden="true"]')

    expect(separators.length).toBeGreaterThanOrEqual(2)
  })

  it('places breadcrumb above eyebrow/title, keeping existing eyebrow/description/actions', () => {
    render(
      <MemoryRouter>
        <PageHeader
          actions={<button type="button">Thêm</button>}
          breadcrumbs={[{ label: 'Booking', to: '/management/bookings' }, { label: 'BKG-1001' }]}
          description="Chi tiết đặt phòng"
          eyebrow="Quản lý"
          title="Booking BKG-1001"
        />
      </MemoryRouter>,
    )

    const header = screen.getByRole('banner')
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const eyebrow = screen.getByText('Quản lý')

    expect(header.contains(nav)).toBe(true)
    expect(nav.compareDocumentPosition(eyebrow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Booking BKG-1001' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm' })).toBeInTheDocument()
  })

  it('truncates long trails gracefully with wrapping enabled', () => {
    render(
      <MemoryRouter>
        <PageHeader
          breadcrumbs={[
            { label: 'Phòng', to: '/management/rooms' },
            { label: 'Phòng 203 — Hướng vườn tầng hai có ban công rất dài' },
          ]}
          title="Chỉnh sửa"
        />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const list = nav.querySelector('ol')

    expect(list?.className).toContain('flex-wrap')
  })
})
