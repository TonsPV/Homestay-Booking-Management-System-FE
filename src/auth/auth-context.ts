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
  /** @deprecated Use the actor-specific login method for new UI flows. */
  login: (
    input: CustomerLoginInput | UserLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>
  loginCustomer: (
    input: CustomerLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>
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
