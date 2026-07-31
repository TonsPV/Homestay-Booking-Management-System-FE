export function resolveSecurePaymentUrl(value: string) {
  try {
    const url = new URL(value)
    const isLoopback =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]'
    const usesSecureTransport =
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && isLoopback)

    if (
      !usesSecureTransport ||
      url.username ||
      url.password
    ) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}
