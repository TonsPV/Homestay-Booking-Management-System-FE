import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'

import { getMe, loginCustomer, loginUser } from './api'
import { AuthProvider } from './AuthProvider'
import { authQueryKeys } from './query-keys'
import {
  clearAuthSession,
  readAuthSession,
  resetAuthSessionMemory,
  saveAuthSession,
} from './session-storage'
import type { AuthPrincipal, AuthSession } from './types'
import { meFromPrincipal } from './types'
import { useAuth } from './useAuth'

vi.mock('./api', () => ({
  getMe: vi.fn(),
  loginCustomer: vi.fn(),
  loginUser: vi.fn(),
}))

const getMeMock = vi.mocked(getMe)
const loginCustomerMock = vi.mocked(loginCustomer)
const loginUserMock = vi.mocked(loginUser)

function customer(fullName: string): AuthPrincipal {
  return {
    actorType: 'customer',
    createdAt: '2026-07-24T00:00:00.000Z',
    email: 'guest@example.com',
    fullName,
    id: 'customer-1',
    phone: '+84900000000',
    status: 'ACTIVE',
    updatedAt: '2026-07-24T01:00:00.000Z',
  }
}

function createSession(
  principal: AuthPrincipal,
  accessToken: string,
): AuthSession {
  return {
    accessToken,
    expiresAt: Date.now() + 60_000,
    persistence: 'local',
    principal,
    tokenType: 'Bearer',
  }
}

function AuthProbe() {
  const { logout, principal, status } = useAuth()

  return (
    <>
      <output data-testid="auth-status">{status}</output>
      <output data-testid="principal">
        {principal ? `${principal.id}:${principal.fullName}` : 'none'}
      </output>
      <button onClick={logout} type="button">
        logout
      </button>
    </>
  )
}

function renderAuthProvider() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Number.POSITIVE_INFINITY,
        retry: false,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return queryClient
}

function dispatchAuthStorageEvent(storageKey: string) {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: storageKey,
      newValue: window.localStorage.getItem(storageKey),
      storageArea: window.localStorage,
    }),
  )
}

beforeEach(() => {
  clearAuthSession()
  resetAuthSessionMemory()
  getMeMock.mockReset()
  loginCustomerMock.mockReset()
  loginUserMock.mockReset()
})

afterEach(() => {
  clearAuthSession()
  resetAuthSessionMemory()
})

describe('AuthProvider session lifecycle', () => {
  it('clears an expired session when the initial /auth/me restore returns 401', async () => {
    saveAuthSession(createSession(customer('Stored customer'), 'expired-token'))
    getMeMock.mockRejectedValueOnce(
      new ApiError('Phiên đăng nhập đã hết hạn.', {
        kind: 'http',
        status: 401,
      }),
    )

    renderAuthProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous')
    })

    expect(screen.getByTestId('principal')).toHaveTextContent('none')
    expect(readAuthSession()).toBeNull()
    expect(getMeMock).toHaveBeenCalledOnce()
  })

  it('keeps the session available for an explicit 403 error', async () => {
    const principal = customer('Stored customer')
    saveAuthSession(createSession(principal, 'access-token'))
    getMeMock.mockRejectedValueOnce(
      new ApiError('Bạn không có quyền thực hiện thao tác này.', {
        kind: 'http',
        status: 403,
      }),
    )

    renderAuthProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('error')
    })

    expect(screen.getByTestId('principal')).toHaveTextContent(
      'customer-1:Stored customer',
    )
    expect(readAuthSession()).not.toBeNull()
  })

  it('revalidates a storage session update instead of reusing cached /auth/me data', async () => {
    const storedPrincipal = customer('Cached old name')
    const serverPrincipal = {
      ...customer('Fresh server name'),
      updatedAt: '2026-07-24T02:00:00.000Z',
    }
    const firstSession = createSession(storedPrincipal, 'first-token')

    saveAuthSession(firstSession)
    getMeMock
      .mockResolvedValueOnce(meFromPrincipal(storedPrincipal))
      .mockResolvedValueOnce(meFromPrincipal(serverPrincipal))

    const queryClient = renderAuthProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated',
      )
    })
    expect(screen.getByTestId('principal')).toHaveTextContent(
      'customer-1:Cached old name',
    )

    const storageKey = window.localStorage.key(0)
    expect(storageKey).not.toBeNull()

    queryClient.setQueryData(['bookings', 'private'], {
      customerId: storedPrincipal.id,
    })
    saveAuthSession(
      createSession(customer('Name from storage event'), 'second-token'),
    )

    act(() => dispatchAuthStorageEvent(storageKey!))

    await waitFor(() => {
      expect(screen.getByTestId('principal')).toHaveTextContent(
        'customer-1:Fresh server name',
      )
    })

    expect(getMeMock).toHaveBeenCalledTimes(2)
    expect(
      queryClient.getQueryData(authQueryKeys.me('customer', 'customer-1')),
    ).toEqual(meFromPrincipal(serverPrincipal))
    expect(queryClient.getQueryData(['bookings', 'private'])).toBeUndefined()
  })

  it('becomes anonymous and clears private cache after a cross-tab logout', async () => {
    const principal = customer('Signed-in customer')

    saveAuthSession(createSession(principal, 'access-token'))
    getMeMock.mockResolvedValueOnce(meFromPrincipal(principal))

    const queryClient = renderAuthProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated',
      )
    })

    const storageKey = window.localStorage.key(0)
    expect(storageKey).not.toBeNull()
    queryClient.setQueryData(['payments', 'private'], {
      customerId: principal.id,
    })
    clearAuthSession()

    act(() => dispatchAuthStorageEvent(storageKey!))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous')
    })

    expect(screen.getByTestId('principal')).toHaveTextContent('none')
    expect(queryClient.getQueryData(['payments', 'private'])).toBeUndefined()
  })

  it('clears the persisted session and all private queries on direct logout', async () => {
    const principal = customer('Signed-in customer')

    saveAuthSession(createSession(principal, 'access-token'))
    getMeMock.mockResolvedValueOnce(meFromPrincipal(principal))

    const queryClient = renderAuthProvider()

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated',
      )
    })
    queryClient.setQueryData(['bookings', 'private'], {
      customerId: principal.id,
    })

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous')
    expect(screen.getByTestId('principal')).toHaveTextContent('none')
    expect(readAuthSession()).toBeNull()
    expect(queryClient.getQueryData(['bookings', 'private'])).toBeUndefined()
  })
})
