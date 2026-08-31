import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { login } from './api'
import { AuthProvider } from './AuthProvider'
import {
  clearAuthSession,
  readAuthSession,
  resetAuthSessionMemory,
} from './session-storage'
import type { LoginResponse } from './types'
import { useAuth } from './useAuth'

vi.mock('./api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  loginCustomer: vi.fn(),
  loginUser: vi.fn(),
}))

const loginMock = vi.mocked(login)

function LoginProbe() {
  const { login, principal } = useAuth()

  return (
    <>
      <output data-testid="principal">{principal?.id ?? 'none'}</output>
      <button
        onClick={() => {
          void login({ identifier: 'who@example.com', password: 'secret' })
        }}
        type="button"
      >
        sign-in
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
        <LoginProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return queryClient
}

const customerLogin: LoginResponse = {
  accessToken: 'customer-token',
  actorType: 'customer',
  customer: {
    createdAt: '2026-08-01T00:00:00.000Z',
    email: 'who@example.com',
    fullName: 'Customer',
    id: 'c-1',
    phone: '+84900000000',
    status: 'ACTIVE',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  expiresIn: 3600,
  tokenType: 'Bearer',
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

describe('unified login()', () => {
  it('exposes a single login method that stores the returned principal', async () => {
    loginMock.mockResolvedValueOnce(customerLogin)
    renderProvider()

    screen.getByRole('button', { name: 'sign-in' }).click()

    await waitFor(() =>
      expect(screen.getByTestId('principal')).toHaveTextContent('c-1'),
    )
    expect(loginMock).toHaveBeenCalledOnce()
    expect(readAuthSession()?.principal.actorType).toBe('customer')
  })
})
