import { configureAccessTokenProvider } from '@/api/client'

import type {
  AccountStatus,
  ActorType,
  AuthPersistence,
  AuthPrincipal,
  AuthSession,
  UserRole,
} from './types'

const AUTH_STORAGE_KEY = 'hbms.auth.session.v1'
const SESSION_VERSION = 1
let memorySession: AuthSession | null = null

interface PersistedAuthSession {
  session: AuthSession
  version: typeof SESSION_VERSION
}

function getStorage(persistence: AuthPersistence): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return persistence === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function removeStoredSession(storage: Storage | null) {
  try {
    storage?.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // The in-memory session remains authoritative when browser storage is blocked.
  }
}

function isActorType(value: unknown): value is ActorType {
  return value === 'customer' || value === 'user'
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === 'ACTIVE' || value === 'LOCKED'
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'STAFF' || value === 'ADMIN'
}

function isPrincipal(value: unknown): value is AuthPrincipal {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<AuthPrincipal>

  if (
    !isActorType(candidate.actorType) ||
    typeof candidate.id !== 'string' ||
    typeof candidate.fullName !== 'string' ||
    !isAccountStatus(candidate.status) ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return false
  }

  if (candidate.actorType === 'customer') {
    return (
      typeof candidate.phone === 'string' &&
      (typeof candidate.email === 'string' || candidate.email === null)
    )
  }

  return (
    typeof candidate.email === 'string' &&
    (typeof candidate.phone === 'string' || candidate.phone === null) &&
    isUserRole(candidate.role)
  )
}

function isAuthSession(
  value: unknown,
  persistence: AuthPersistence,
): value is AuthSession {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<AuthSession>

  return (
    candidate.persistence === persistence &&
    candidate.tokenType === 'Bearer' &&
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.expiresAt === 'number' &&
    Number.isFinite(candidate.expiresAt) &&
    isPrincipal(candidate.principal)
  )
}

function readFrom(persistence: AuthPersistence): AuthSession | null {
  const storage = getStorage(persistence)
  const fallback =
    memorySession?.persistence === persistence ? memorySession : null

  if (!storage) {
    return fallback
  }

  let raw: string | null

  try {
    raw = storage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return fallback
  }

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedAuthSession>

    if (
      parsed.version !== SESSION_VERSION ||
      !isAuthSession(parsed.session, persistence)
    ) {
      removeStoredSession(storage)
      return null
    }

    if (parsed.session.expiresAt <= Date.now()) {
      removeStoredSession(storage)
      return null
    }

    memorySession = parsed.session
    return parsed.session
  } catch {
    removeStoredSession(storage)
    return null
  }
}

export function readAuthSession(): AuthSession | null {
  return readFrom('session') ?? readFrom('local')
}

export function saveAuthSession(session: AuthSession) {
  clearAuthSession()
  memorySession = session

  try {
    getStorage(session.persistence)?.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        session,
        version: SESSION_VERSION,
      } satisfies PersistedAuthSession),
    )
  } catch {
    // Private mode and storage policies may reject writes; keep this tab signed in.
  }
}

export function clearAuthSession() {
  memorySession = null
  removeStoredSession(getStorage('local'))
  removeStoredSession(getStorage('session'))
}

export function resetAuthSessionMemory() {
  memorySession = null
}

export function isAuthStorageEvent(event: StorageEvent) {
  return event.key === AUTH_STORAGE_KEY
}

configureAccessTokenProvider(() => readAuthSession()?.accessToken ?? null)
