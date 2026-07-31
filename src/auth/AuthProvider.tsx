import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ApiError } from '@/api/errors'
import { configureUnauthorizedHandler } from '@/api/client'

import {
  getMe,
  loginCustomer as requestCustomerLogin,
  loginUser as requestUserLogin,
} from './api'
import { AuthContext, type AuthContextValue } from './auth-context'
import {
  clearAuthSession,
  isAuthStorageEvent,
  readAuthSession,
  resetAuthSessionMemory,
  saveAuthSession,
} from './session-storage'
import { authQueryKeys } from './query-keys'
import {
  meFromPrincipal,
  principalFromLogin,
  principalFromMe,
  type AuthPersistence,
  type AuthPrincipal,
  type AuthSession,
  type CustomerLoginInput,
  type LoginResponse,
  type UserLoginInput,
} from './types'

interface AuthProviderProps {
  children: ReactNode
}

function createSession(
  response: LoginResponse,
  persistence: AuthPersistence,
): AuthSession {
  return {
    accessToken: response.accessToken,
    expiresAt: Date.now() + response.expiresIn * 1_000,
    persistence,
    principal: principalFromLogin(response),
    tokenType: response.tokenType,
  }
}

function principalsAreEqual(left: AuthPrincipal, right: AuthPrincipal) {
  if (left.actorType !== right.actorType) {
    return false
  }

  return (
    left.id === right.id &&
    left.fullName === right.fullName &&
    left.email === right.email &&
    left.phone === right.phone &&
    left.status === right.status &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt &&
    (left.actorType === 'customer' ||
      (right.actorType === 'user' && left.role === right.role))
  )
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AuthSession | null>(() =>
    readAuthSession(),
  )
  const meQueryKey = authQueryKeys.me(
    session?.principal.actorType,
    session?.principal.id,
  )

  const meQuery = useQuery({
    enabled: session !== null,
    queryFn: ({ signal }) => getMe(signal),
    queryKey: meQueryKey,
    retry: false,
    staleTime: 5 * 60 * 1_000,
  })

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  const updatePrincipal = useCallback(
    (principal: AuthPrincipal) => {
      setSession((current) => {
        if (!current || current.principal.actorType !== principal.actorType) {
          return current
        }

        if (principalsAreEqual(current.principal, principal)) {
          return current
        }

        const next = { ...current, principal }

        saveAuthSession(next)
        queryClient.setQueryData(
          authQueryKeys.me(principal.actorType, principal.id),
          meFromPrincipal(principal),
        )

        return next
      })
    },
    [queryClient],
  )

  useEffect(() => {
    if (!meQuery.data || !session) {
      return
    }

    const principal = principalFromMe(meQuery.data)

    if (
      principal.actorType !== session.principal.actorType ||
      principal.id !== session.principal.id
    ) {
      logout()
      return
    }

    updatePrincipal(principal)
  }, [logout, meQuery.data, session, updatePrincipal])

  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.isStatus(401)) {
      logout()
    }
  }, [logout, meQuery.error])

  useEffect(() => {
    configureUnauthorizedHandler(logout)
    return () => configureUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const synchronizeSession = (event: StorageEvent) => {
      if (isAuthStorageEvent(event)) {
        void queryClient.cancelQueries()
        queryClient.clear()
        resetAuthSessionMemory()
        setSession(readAuthSession())
      }
    }

    window.addEventListener('storage', synchronizeSession)
    return () => window.removeEventListener('storage', synchronizeSession)
  }, [queryClient])

  const storeLogin = useCallback(
    (response: LoginResponse, persistence: AuthPersistence) => {
      const next = createSession(response, persistence)

      queryClient.clear()
      queryClient.setQueryData(
        authQueryKeys.me(next.principal.actorType, next.principal.id),
        meFromPrincipal(next.principal),
      )
      saveAuthSession(next)
      setSession(next)

      return next.principal
    },
    [queryClient],
  )

  const loginCustomer = useCallback(
    async (
      input: CustomerLoginInput,
      persistence: AuthPersistence = 'session',
    ) => storeLogin(await requestCustomerLogin(input), persistence),
    [storeLogin],
  )

  const loginUser = useCallback(
    async (
      input: UserLoginInput,
      persistence: AuthPersistence = 'session',
    ) => storeLogin(await requestUserLogin(input), persistence),
    [storeLogin],
  )

  const restore = useCallback(async () => {
    if (!session) {
      return null
    }

    const result = await meQuery.refetch()

    if (result.error) {
      if (result.error instanceof ApiError && result.error.isStatus(401)) {
        logout()
        return null
      }

      throw result.error
    }

    if (!result.data) {
      return session.principal
    }

    const principal = principalFromMe(result.data)
    updatePrincipal(principal)

    return principal
  }, [logout, meQuery, session, updatePrincipal])

  const status = useMemo<AuthContextValue['status']>(() => {
    if (!session) {
      return 'anonymous'
    }

    if (meQuery.isPending) {
      return 'restoring'
    }

    if (meQuery.error) {
      return 'error'
    }

    return 'authenticated'
  }, [meQuery.error, meQuery.isPending, session])

  const value = useMemo<AuthContextValue>(
    () => ({
      error: meQuery.error,
      isAuthenticated: session !== null,
      loginCustomer,
      loginUser,
      logout,
      principal: session?.principal ?? null,
      restore,
      status,
      updatePrincipal,
    }),
    [
      loginCustomer,
      loginUser,
      logout,
      meQuery.error,
      restore,
      session,
      status,
      updatePrincipal,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
