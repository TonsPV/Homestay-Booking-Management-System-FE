import { createContext } from "react";

import type {
  AuthPersistence,
  AuthPrincipal,
  AuthStatus,
  CustomerLoginInput,
  GoogleCustomerLoginInput,
  UserLoginInput,
} from "./types";

export interface AuthContextValue {
  error: unknown;
  isAuthenticated: boolean;
  /** Canonical sign-in flow. The server resolves the account role. */
  login: (
    input: CustomerLoginInput | UserLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>;
  loginCustomer: (
    input: CustomerLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>;
  loginCustomerWithGoogle?: (
    input: GoogleCustomerLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>;
  loginUser: (
    input: UserLoginInput,
    persistence?: AuthPersistence,
  ) => Promise<AuthPrincipal>;
  logout: () => void;
  principal: AuthPrincipal | null;
  restore: () => Promise<AuthPrincipal | null>;
  status: AuthStatus;
  updatePrincipal: (principal: AuthPrincipal) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
