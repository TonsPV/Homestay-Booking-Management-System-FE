interface LoginLocationState {
  returnTo?: string
}

export function getSafeReturnTo(state: unknown, fallback: string) {
  if (typeof state !== 'object' || state === null) {
    return fallback
  }

  const returnTo = (state as LoginLocationState).returnTo

  return typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//')
    ? returnTo
    : fallback
}
