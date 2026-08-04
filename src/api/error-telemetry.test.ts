import { describe, expect, it, vi } from 'vitest'

const reportRuntimeError = vi.hoisted(() => vi.fn())

vi.mock('@/app/error-reporting', () => ({ reportRuntimeError }))

import { recordUnknownErrorCode } from './error-telemetry'

describe('unknown API error-code telemetry', () => {
  it('reports an unknown code once with request context', () => {
    recordUnknownErrorCode('FUTURE_DOMAIN_RULE', {
      requestId: 'request-42',
      status: 409,
    })
    recordUnknownErrorCode('FUTURE_DOMAIN_RULE', {
      requestId: 'request-43',
      status: 409,
    })

    expect(reportRuntimeError).toHaveBeenCalledTimes(1)
    expect(reportRuntimeError).toHaveBeenCalledWith(
      expect.any(Error),
      'unknown-api-error-code',
      {
        errorCode: 'FUTURE_DOMAIN_RULE',
        requestId: 'request-42',
        status: 409,
      },
    )
  })
})
