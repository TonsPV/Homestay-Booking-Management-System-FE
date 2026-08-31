import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { login } from './api'
import { AuthProvider } from './AuthProvider'
import {
  clearAuthSession,
  readAuthSession,
  resetAuthSessionMemory,
  saveAuthSession,
} from './session-storage'
import type { AuthPrincipal, LoginResponse } from './types'
import { useAuth } from './useAuth'
import { resolvePostLoginRoute } from '@/routes/workspace-policy'

vi.mock('./api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginCustomer: vi.fn(),
  loginUser: vi.fn(),
}))

const loginMock = vi.mocked(login)

const staffPrincipal: AuthPrincipal = {
  actorType: 'user',
  createdAt: '2026-08-22T00:00:00.000Z',
  email: 'staff@example.com',
  fullName: 'Staff',
  id: 'staff-1',
  phone: null,
  role: 'STAFF',
  status: 'ACTIVE',
  updatedAt: '2026-08-22T00:00:00.000Z',
}

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

function Probe() {
  const { login, logout, principal } = useAuth()

  return (
    <>
      <output data-testid="actor">{principal?.actorType ?? 'none'}</output>
      <output data-testid="role">
        {principal?.actorType === 'user' ? principal.role : 'none'}
      </output>
      <button
        onClick={() => {
          void login({ identifier: 'admin@example.com', password: 'secret' })
        }}
        type="button"
      >
        sign-in-admin
      </button>
      <button onClick={logout} type="button">
        logout
      </button>
    </>
  )
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
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

describe('session switch STAFF → ADMIN (regression)', () => {
  it('does not leak the previous STAFF principal after an ADMIN login', async () => {
    // Simulate a stale STAFF session from the previous day
    saveAuthSession({
      accessToken: 'staff-token',
      expiresAt: Date.now() + 60_000,
      persistence: 'local',
      principal: staffPrincipal,
      tokenType: 'Bearer',
    })

    loginMock.mockResolvedValueOnce(adminLoginResponse)
    renderProvider()

    expect(screen.getByTestId('role')).toHaveTextContent('STAFF')

    act(() => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    loginMock.mockResolvedValueOnce(adminLoginResponse)

    act(() => {
      screen.getByRole('button', { name: 'sign-in-admin' }).click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('role')).toHaveTextContent('ADMIN'),
    )

    const session = readAuthSession()
    expect(session?.principal.actorType).toBe('user')
    expect(
      session?.principal.actorType === 'user' ? session.principal.role : 'none',
    ).toBe('ADMIN')

    expect(resolvePostLoginRoute(session!.principal)).toBe(
      '/management/bookings',
    )
  })
})
