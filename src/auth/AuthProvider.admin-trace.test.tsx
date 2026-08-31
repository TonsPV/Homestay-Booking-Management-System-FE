import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { login } from './api'
import { AuthProvider } from './AuthProvider'
import {
  clearAuthSession,
  readAuthSession,
  resetAuthSessionMemory,
} from './session-storage'
import type { LoginResponse } from './types'
import { useAuth } from './useAuth'
import { resolvePostLoginRoute } from '@/routes/workspace-policy'

vi.mock('./api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginCustomer: vi.fn(),
  loginUser: vi.fn(),
}))

const loginMock = vi.mocked(login)

const adminLoginResponse: LoginResponse = {
  accessToken: 'admin-token',
  actorType: 'user',
  expiresIn: 3600,
  tokenType: 'Bearer',
  user: {
    createdAt: '2026-08-22T00:00:00.000Z',
    email: 'admin@example.com',
    fullName: 'Admin',
    id: 'admin-1',
    phone: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
}

function LoginAndRouteProbe() {
  const { login } = useAuth()

  return (
    <button
      onClick={() => {
        void login({ identifier: 'admin@example.com', password: 'secret' })
      }}
      type="button"
    >
      sign-in
    </button>
  )
}

function LocationProbe() {
  return <div>location:{useLocation().pathname}</div>
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <LoginAndRouteProbe />
          <LocationProbe />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  clearAuthSession()
  resetAuthSessionMemory()
  loginMock.mockReset()
})

afterEach(() => {
  clearAuthSession()
  resetAuthSessionMemory()
})

describe('ADMIN principal end-to-end tracing (regression)', () => {
  it('preserves role=ADMIN after login + storeLogin + resolvePostLoginRoute', async () => {
    loginMock.mockResolvedValueOnce(adminLoginResponse)
    renderProvider()

    screen.getByRole('button', { name: 'sign-in' }).click()

    await waitFor(() => {
      const session = readAuthSession()
      expect(session?.principal.actorType).toBe('user')
      expect(
        session?.principal.actorType === 'user'
          ? session.principal.role
          : undefined,
      ).toBe('ADMIN')
    })

    const principal = readAuthSession()?.principal
    expect(principal).toBeDefined()

    const home = resolvePostLoginRoute(principal!)
    expect(home).toBe('/management/bookings')
    expect(home).not.toBe('/staff/counter')
  })
})
