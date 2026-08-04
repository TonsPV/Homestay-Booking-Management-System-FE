import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LinkButton } from './LinkButton'

describe('LinkButton', () => {
  it('forwards its children into the rendered link and exposes an accessible name', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/rooms">Khám phá phòng</LinkButton>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Khám phá phòng' }),
    ).toHaveAttribute('href', '/rooms')
  })
})