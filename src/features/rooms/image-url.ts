import { appConfig } from '@/app/config'

export function resolveRoomImageUrl(imageUrl: string) {
  try {
    const resolvedUrl = new URL(imageUrl, `${appConfig.apiOrigin}/`)

    if (
      resolvedUrl.protocol === 'http:' ||
      resolvedUrl.protocol === 'https:'
    ) {
      return resolvedUrl.toString()
    }
  } catch {
    // Invalid values must not become browser-controlled URL schemes.
  }

  return undefined
}
