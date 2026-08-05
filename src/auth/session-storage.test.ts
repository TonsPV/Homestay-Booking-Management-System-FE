import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthSession } from './types'
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
} from './session-storage'

function createSession(
  persistence: AuthSession['persistence'] = 'session',
): AuthSession {
  return {
    accessToken: 'access-token',
    expiresAt: Date.now() + 60_000,
    persistence,
    principal: {
      actorType: 'customer',
      createdAt: '2026-07-24T00:00:00.000Z',
      email: 'guest@example.com',
      fullName: 'Guest',
      id: 'customer-1',
      phone: '0900000000',
      status: 'ACTIVE',
      updatedAt: '2026-07-24T00:00:00.000Z',
    },
    tokenType: 'Bearer',
  }
}

beforeEach(() => {
  clearAuthSession()
})

afterEach(() => {
  vi.restoreAllMocks()
  clearAuthSession()
})

describe('auth session storage', () => {
  it('uses sessionStorage by default and localStorage only for explicit remember', () => {
    const session = createSession()

    saveAuthSession(session)

    expect(window.sessionStorage.getItem('hbms.auth.session.v1')).not.toBeNull()
    expect(window.localStorage.getItem('hbms.auth.session.v1')).toBeNull()

    const remembered = createSession('local')
    saveAuthSession(remembered)

    expect(window.localStorage.getItem('hbms.auth.session.v1')).not.toBeNull()
    expect(window.sessionStorage.getItem('hbms.auth.session.v1')).toBeNull()
  })

  it('round-trips a session with its selected persistence', () => {
    const session = createSession('local')

    saveAuthSession(session)

    expect(readAuthSession()).toEqual(session)
    expect(window.sessionStorage.length).toBe(0)
  })

  it('rejects an expired persisted session', () => {
    const session = {
      ...createSession(),
      expiresAt: Date.now() - 1,
    }

    saveAuthSession(session)

    expect(readAuthSession()).toBeNull()
  })

  it('removes malformed persisted JSON instead of keeping it in storage', () => {
    window.sessionStorage.setItem('hbms.auth.session.v1', '{malformed')

    expect(readAuthSession()).toBeNull()
    expect(window.sessionStorage.getItem('hbms.auth.session.v1')).toBeNull()
  })

  it('falls back to memory when browser storage rejects writes', () => {
    const session = createSession()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(() => saveAuthSession(session)).not.toThrow()
    expect(readAuthSession()).toEqual(session)
  })

  it('does not throw when browser storage rejects reads and removals', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(() => clearAuthSession()).not.toThrow()
    expect(readAuthSession()).toBeNull()
  })
})
