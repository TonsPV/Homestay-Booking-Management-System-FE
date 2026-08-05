const DEFAULT_API_ORIGIN = 'http://localhost:3000'
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

interface ApiOriginOptions {
  configuredOrigin?: string
  production?: boolean
}

function resolveHttpUrl(value: string, variableName: string) {
  try {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`${variableName} must use HTTP or HTTPS.`)
    }

    return url
  } catch {
    throw new Error(
      `${variableName} must be an absolute HTTP(S) URL.`,
    )
  }
}

export function isRuntimeUrlSecure(
  url: URL,
  production: boolean,
) {
  if (!production) {
    return true
  }

  return url.protocol === 'https:' && !LOOPBACK_HOSTNAMES.has(url.hostname)
}

function assertSecureRuntimeUrl(
  url: URL,
  variableName: string,
  production = import.meta.env.PROD,
) {
  if (!isRuntimeUrlSecure(url, production)) {
    throw new Error(
      `${variableName} must use HTTPS in production.`,
    )
  }
}

export function resolveApiOrigin(options: ApiOriginOptions = {}) {
  const configuredOrigin = (
    options.configuredOrigin ?? import.meta.env.VITE_API_ORIGIN
  )?.trim()
  const production = options.production ?? import.meta.env.PROD

  if (production && !configuredOrigin) {
    throw new Error('VITE_API_ORIGIN is required in production.')
  }

  const origin = (configuredOrigin || DEFAULT_API_ORIGIN).replace(/\/+$/, '')
  const url = resolveHttpUrl(origin, 'VITE_API_ORIGIN')

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      'VITE_API_ORIGIN must be an origin without a path, query, or fragment.',
    )
  }

  if (!isRuntimeUrlSecure(url, production)) {
    assertSecureRuntimeUrl(url, 'VITE_API_ORIGIN', production)
  }

  return url.origin
}

function resolveErrorReportingEndpoint() {
  const endpoint = import.meta.env.VITE_ERROR_REPORTING_ENDPOINT?.trim()

  if (!endpoint) {
    return null
  }

  const url = resolveHttpUrl(endpoint, 'VITE_ERROR_REPORTING_ENDPOINT')

  assertSecureRuntimeUrl(url, 'VITE_ERROR_REPORTING_ENDPOINT')

  return url.toString()
}

export const appConfig = {
  apiOrigin: resolveApiOrigin(),
  apiPrefix: '/api/v1',
  appRelease: import.meta.env.VITE_APP_RELEASE?.trim() || null,
  currency: 'VND',
  errorReportingEndpoint: resolveErrorReportingEndpoint(),
  locale: 'vi-VN',
  timeZone: 'Asia/Ho_Chi_Minh',
} as const
