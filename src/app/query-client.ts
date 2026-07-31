import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/errors'

function shouldRetry(failureCount: number, error: unknown) {
  if (error instanceof ApiError) {
    if (error.kind === 'aborted' || error.kind === 'parse') {
      return false
    }

    if (error.status && error.status >= 400 && error.status < 500) {
      return false
    }
  }

  return failureCount < 1
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        refetchOnWindowFocus: true,
        retry: shouldRetry,
        staleTime: 30_000,
      },
    },
  })
}
