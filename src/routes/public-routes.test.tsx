import { isValidElement } from 'react'
import { Navigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { publicRoutes } from './public-routes'

describe('public chat routing', () => {
  it('redirects the retired customer inbox to bookings', () => {
    const customerGuard = publicRoutes.find((route) =>
      route.children?.some((child) => child.path === 'messages'),
    )
    const messagesRoute = customerGuard?.children?.find(
      (child) => child.path === 'messages',
    )

    expect(messagesRoute?.lazy).toBeUndefined()
    expect(
      isValidElement<{ replace?: boolean; to: string }>(
        messagesRoute?.element,
      ),
    ).toBe(true)

    if (
      !isValidElement<{ replace?: boolean; to: string }>(
        messagesRoute?.element,
      )
    ) {
      throw new Error('The retired customer inbox must be a redirect.')
    }

    expect(messagesRoute.element.type).toBe(Navigate)
    expect(messagesRoute.element.props.replace).toBe(true)
    expect(messagesRoute.element.props.to).toBe('/bookings')
  })
})
