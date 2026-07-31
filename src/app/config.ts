const DEFAULT_API_ORIGIN = 'http://localhost:3000'

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
  if (!production || url.protocol === 'https:') {
    return true
  }

  return (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]')
  )
}

function assertSecureRuntimeUrl(url: URL, variableName: string) {
  if (!isRuntimeUrlSecure(url, import.meta.env.PROD)) {
    throw new Error(
      `${variableName} must use HTTPS in production.`,
    )
  }
}

function resolveApiOrigin() {
  const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim()
  const origin = (configuredOrigin || DEFAULT_API_ORIGIN).replace(/\/+$/, '')
  const url = resolveHttpUrl(origin, 'VITE_API_ORIGIN')

  assertSecureRuntimeUrl(url, 'VITE_API_ORIGIN')

  return origin
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
