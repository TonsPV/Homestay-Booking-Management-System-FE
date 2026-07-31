import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  appConfig: {
    appRelease: 'release-test',
    errorReportingEndpoint: 'https://errors.example.test/report' as
      | string
      | null,
  },
}))

vi.mock('./config', () => ({
  appConfig: mocks.appConfig,
}))

import {
  installGlobalErrorReporting,
  reportRuntimeError,
} from './error-reporting'

const originalSendBeacon = Object.getOwnPropertyDescriptor(
  navigator,
  'sendBeacon',
)

beforeEach(() => {
  mocks.appConfig.errorReportingEndpoint =
    'https://errors.example.test/report'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()

  if (originalSendBeacon) {
    Object.defineProperty(navigator, 'sendBeacon', originalSendBeacon)
  } else {
    Reflect.deleteProperty(navigator, 'sendBeacon')
  }
})

describe('runtime error reporting', () => {
  it('uses sendBeacon without leaking the current query string', async () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })
    window.history.replaceState({}, '', '/management/payments?secret=value')

    reportRuntimeError(
      new Error('Unexpected render'),
      'react-boundary',
      { componentStack: 'at PaymentPage' },
    )

    expect(sendBeacon).toHaveBeenCalledOnce()
    const [endpoint, body] = sendBeacon.mock.calls[0] as [string, Blob]
    const payload = JSON.parse(await body.text()) as Record<string, unknown>

    expect(endpoint).toBe('https://errors.example.test/report')
    expect(payload).toMatchObject({
      componentStack: 'at PaymentPage',
      message: 'Unexpected render',
      path: `${window.location.origin}/management/payments`,
      release: 'release-test',
      source: 'react-boundary',
    })
    expect(String(payload.path)).not.toContain('secret')
  })

  it('falls back to keepalive fetch and never throws on reporting failure', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    })
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    expect(() =>
      reportRuntimeError('Rejected promise', 'unhandled-rejection'),
    ).not.toThrow()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://errors.example.test/report',
      expect.objectContaining({
        keepalive: true,
        method: 'POST',
      }),
    )
  })

  it('installs removable handlers for global errors and rejections', () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })
    const uninstall = installGlobalErrorReporting()

    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new Error('window failed'),
        message: 'window failed',
      }),
    )
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.resolve(),
        reason: new Error('promise failed'),
      }),
    )
    expect(sendBeacon).toHaveBeenCalledTimes(2)

    uninstall()
    window.dispatchEvent(new Event('error'))
    expect(sendBeacon).toHaveBeenCalledTimes(2)
  })
})
