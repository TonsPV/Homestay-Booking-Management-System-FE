import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FilterBar } from './FilterBar'

describe('FilterBar', () => {
  it('renders an accessible form landmark with an aria-label', () => {
    render(
      <FilterBar aria-label="Lọc danh sách booking">
        <FilterBar.Fields>
          <input aria-label="Từ khóa" />
        </FilterBar.Fields>
        <FilterBar.Actions>
          <button type="submit">Lọc</button>
        </FilterBar.Actions>
      </FilterBar>,
    )

    expect(
      screen.getByRole('search', { name: 'Lọc danh sách booking' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Từ khóa')).toBeInTheDocument()
  })

  it('lays out fields and actions with the filter-bar grammar', () => {
    render(
      <FilterBar aria-label="Lọc">
        <FilterBar.Fields>
          <input aria-label="Trạng thái" />
        </FilterBar.Fields>
        <FilterBar.Actions>
          <button type="submit">Áp dụng</button>
          <button type="button">Đặt lại</button>
        </FilterBar.Actions>
      </FilterBar>,
    )

    expect(screen.getByLabelText('Trạng thái').parentElement?.className).toContain(
      'gap-4',
    )
    const apply = screen.getByRole('button', { name: 'Áp dụng' })
    const actions = apply.parentElement

    expect(actions?.className).toContain('flex')
    expect(actions?.className).toContain('items-end')
    expect(actions?.className).toContain('gap-2')
    expect(actions?.className).toContain('shrink-0')
  })

  it('supports an optional trailing slot for more actions', () => {
    render(
      <FilterBar aria-label="Lọc thanh toán">
        <FilterBar.Fields>
          <input aria-label="Trạng thái" />
        </FilterBar.Fields>
        <FilterBar.Actions>
          <button type="submit">Lọc</button>
        </FilterBar.Actions>
        <FilterBar.MoreActions>
          <a href="/management/payments?status=REQUIRES_REVIEW">Hàng đợi</a>
        </FilterBar.MoreActions>
      </FilterBar>,
    )

    expect(
      screen.getByRole('link', { name: 'Hàng đợi' }).parentElement?.className,
    ).toContain('ml-auto')
  })

  it('forwards form props such as onSubmit and custom className', () => {
    let submitted = 0
    render(
      <FilterBar
        aria-label="Lọc phòng"
        className="shadow-none"
        onSubmit={(event) => {
          event.preventDefault()
          submitted += 1
        }}
      >
        <FilterBar.Fields>
          <input aria-label="Loại phòng" />
        </FilterBar.Fields>
      </FilterBar>,
    )

    const form = screen.getByRole('search', { name: 'Lọc phòng' })
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    expect(submitted).toBe(1)
    expect(form.className).toContain('shadow-none')
    expect(form.className).toContain('rounded-panel')
  })
})
