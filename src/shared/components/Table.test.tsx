import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Table, TableBody, TableHead, TableTd, TableTh, TableTr } from './Table'

describe('Table', () => {
  it('renders a semantic table with a visually hidden caption', () => {
    render(
      <Table caption="Operational rows">
        <TableBody>
          <TableTr>
            <TableTd>Tính năng</TableTd>
          </TableTr>
        </TableBody>
      </Table>,
    )

    const table = screen.getByRole('table', { name: 'Operational rows' })
    const caption = table.querySelector('caption')

    expect(caption).toHaveTextContent('Operational rows')
    expect(caption?.className).toContain('sr-only')
  })

  it('applies the management header grammar to TableHead and header cells', () => {
    render(
      <Table caption="Giao dịch">
        <TableHead>
          <TableTr>
            <TableTh>Mã giao dịch</TableTh>
          </TableTr>
        </TableHead>
        <TableBody>
          <TableTr>
            <TableTd>#42</TableTd>
          </TableTr>
        </TableBody>
      </Table>,
    )

    const header = screen.getByRole('columnheader', { name: 'Mã giao dịch' })
    const thead = header.closest('thead')

    expect(thead?.className).toContain('bg-surface-muted')
    expect(thead?.className).toContain('text-xs')
    expect(thead?.className).toContain('uppercase')
    expect(thead?.className).toContain('tracking-wide')
    expect(thead?.className).toContain('text-muted')
    expect(header.className).toContain('px-4')
    expect(header.className).toContain('py-3')
  })

  it('applies cell density and row hover grammar to body rows', () => {
    render(
      <Table caption="Phòng">
        <TableBody>
          <TableTr>
            <TableTd>101</TableTd>
          </TableTr>
        </TableBody>
      </Table>,
    )

    const cell = screen.getByRole('cell', { name: '101' })
    const row = cell.closest('tr')

    expect(cell.className).toContain('px-4')
    expect(cell.className).toContain('py-3')
    expect(row?.className).toContain('hover:bg-surface-muted')
    expect(row?.className).toContain('align-top')
  })

  it('supports a custom min-width on the inner table element', () => {
    render(
      <Table caption="Booking" minW="72rem">
        <TableBody>
          <TableTr>
            <TableTd>BKG-1</TableTd>
          </TableTr>
        </TableBody>
      </Table>,
    )

    expect(screen.getByRole('table', { name: 'Booking' }).className).toContain(
      'min-w-[72rem]',
    )
  })

  it('merges additional classNames and forwards html attributes', () => {
    render(
      <Table caption="Tùy chỉnh" className="shadow-none">
        <TableBody>
          <TableTr className="bg-brand-soft" data-state="selected">
            <TableTd className="font-bold" data-testid="cell">
              Nổi bật
            </TableTd>
          </TableTr>
        </TableBody>
      </Table>,
    )

    const table = screen.getByRole('table', { name: 'Tùy chỉnh' })
    const wrapper = table.parentElement
    const cell = screen.getByTestId('cell')

    expect(wrapper?.className).toContain('shadow-none')
    expect(wrapper?.className).toContain('overflow-x-auto')
    const row = table.querySelector('tr')

    expect(row?.className).toContain('bg-brand-soft')
    expect(row).toHaveAttribute('data-state', 'selected')
    expect(cell.className).toContain('font-bold')
  })
})
