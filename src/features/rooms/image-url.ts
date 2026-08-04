import { appConfig } from '@/app/config'

function resolveImageOrigin() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin
  }

  return appConfig.apiOrigin
}

export function resolveRoomImageUrl(imageUrl: string) {
  try {
    const resolvedUrl = new URL(imageUrl, `${resolveImageOrigin()}/`)

    if (
      resolvedUrl.protocol === 'http:' ||
      resolvedUrl.protocol === 'https:'
    ) {
      if (
        import.meta.env.DEV &&
        resolvedUrl.origin === appConfig.apiOrigin
      ) {
        return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
      }

      return resolvedUrl.toString()
    }
  } catch {
    // Invalid values must not become browser-controlled URL schemes.
  }

  return undefined
}
