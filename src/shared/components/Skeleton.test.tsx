import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('is hidden from assistive technology and pulses for sighted users', () => {
    render(<Skeleton data-testid="block" variant="block" />)
    const node = screen.getByTestId('block')

    expect(node).toHaveAttribute('aria-hidden', 'true')
    expect(node.className).toContain('motion-safe:animate-pulse')
    expect(node.className).toContain('bg-surface-muted')
  })

  it('renders a line skeleton with a rounded control radius', () => {
    render(<Skeleton data-testid="line" variant="line" />)

    expect(screen.getByTestId('line').className).toContain('rounded-control')
    expect(screen.getByTestId('line').className).toContain('h-4')
  })

  it('renders a card skeleton with panel radius and default height', () => {
    render(<Skeleton data-testid="card" variant="card" />)

    expect(screen.getByTestId('card').className).toContain('rounded-panel')
    expect(screen.getByTestId('card').className).toContain('min-h-48')
  })

  it('renders a block skeleton with a default 4/3 aspect ratio', () => {
    render(<Skeleton data-testid="block" variant="block" />)

    expect(screen.getByTestId('block').className).toContain('aspect-[4/3]')
  })

  it('merges custom layout classes without breaking its neutral appearance', () => {
    render(
      <Skeleton
        className="h-6 w-1/2"
        data-testid="custom"
        variant="line"
      />,
    )
    const node = screen.getByTestId('custom')

    expect(node.className).toContain('h-6')
    expect(node.className).toContain('w-1/2')
    expect(node.className).toContain('bg-surface-muted')
  })
})
