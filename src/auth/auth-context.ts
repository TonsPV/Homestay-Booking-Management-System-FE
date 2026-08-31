import { createContext } from 'react'

import type {
  AuthPersistence,
  AuthPrincipal,
  AuthStatus,
  CustomerLoginInput,
  UserLoginInput,
} from './types'

export interface AuthContextValue {
  error: unknown
  isAuthenticated: boolean
  login: (
    input: CustomerLoginInput | UserLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>
  /** @deprecated use `login` — kept for callers migrating off split flows. */
  loginCustomer: (
    input: CustomerLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>
  /** @deprecated use `login` — kept for callers migrating off split flows. */
  loginUser: (
    input: UserLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>
  logout: () => void
  principal: AuthPrincipal | null
  restore: () => Promise<AuthPrincipal | null>
  status: AuthStatus
  updatePrincipal: (principal: AuthPrincipal) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
