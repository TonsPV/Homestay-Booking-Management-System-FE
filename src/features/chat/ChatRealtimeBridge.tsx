import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'

import { appConfig } from '@/app/config'
import { readAuthSession } from '@/auth/session-storage'
import { useAuth } from '@/auth/useAuth'

import { synchronizeBookingMessages } from './message-sync'
import { chatKeys } from './query-keys'

const REST_RECONCILIATION_INTERVAL_MS = 30_000

/** Keeps one Socket.IO connection for the current login in this browser tab. */
export function ChatRealtimeBridge() {
  const { principal } = useAuth()
  const queryClient = useQueryClient()
  const actorKey = principal ? `${principal.actorType}:${principal.id}` : null
  const session = readAuthSession()
  const accessToken = session?.accessToken ?? null
  const sessionExpiresAt = session?.expiresAt ?? null

  useEffect(() => {
    if (!appConfig.chatEnabled || !actorKey || !accessToken) {
      return
    }

    if (sessionExpiresAt === null || sessionExpiresAt <= Date.now()) {
      return
    }

    let refreshScheduled = false
    let refreshAll = false
    const bookingIds = new Set<string>()
    const refreshActiveChatQueries = (bookingId?: string) => {
      if (bookingId) {
        bookingIds.add(bookingId)
      } else {
        refreshAll = true
      }

      if (refreshScheduled) {
        return
      }

      refreshScheduled = true
      queueMicrotask(() => {
        refreshScheduled = false
        const syncAll = refreshAll
        const changedBookingIds = [...bookingIds]
        refreshAll = false
        bookingIds.clear()

        void refreshChatData(queryClient, syncAll ? undefined : changedBookingIds).catch(
          () => {
            // The next socket signal or REST reconciliation retries the sync.
          },
        )
      })
    }
    const origin = import.meta.env.DEV
      ? window.location.origin
      : appConfig.apiOrigin
    const socket = io(`${origin}/chat`, {
      auth: { token: accessToken },
      path: '/socket.io',
      transports: ['websocket'],
    })
    const reconcileTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshActiveChatQueries()
      }
    }, REST_RECONCILIATION_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshActiveChatQueries()
      }
    }
    const onChatChanged = (payload: unknown) => {
      refreshActiveChatQueries(getChangedBookingId(payload))
    }
    const onConnect = () => refreshActiveChatQueries()

    socket.on('chat:changed', onChatChanged)
    socket.on('connect', onConnect)
    document.addEventListener('visibilitychange', onVisibilityChange)
    refreshActiveChatQueries()

    return () => {
      window.clearInterval(reconcileTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      socket.off('chat:changed', onChatChanged)
      socket.off('connect', onConnect)
      socket.disconnect()
    }
  }, [accessToken, actorKey, queryClient, sessionExpiresAt])

  return null
}

async function refreshChatData(
  queryClient: QueryClient,
  bookingIds?: readonly string[],
) {
  try {
    await synchronizeActiveMessageQueries(queryClient, bookingIds)
  } finally {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
        refetchType: 'active',
      }),
      queryClient.invalidateQueries({
        queryKey: chatKeys.summary(),
        refetchType: 'active',
      }),
    ]

    if (bookingIds === undefined) {
      invalidations.push(
        queryClient.invalidateQueries({
          predicate: (query) => isBookingContextQuery(query.queryKey),
          refetchType: 'active',
        }),
      )
    } else {
      invalidations.push(
        ...bookingIds.map((bookingId) =>
          queryClient.invalidateQueries({
            exact: true,
            queryKey: chatKeys.booking(bookingId),
            refetchType: 'active',
          }),
        ),
      )
    }

    await Promise.all(invalidations)
  }
}

async function synchronizeActiveMessageQueries(
  queryClient: QueryClient,
  bookingIds?: readonly string[],
) {
  const activeBookingIds = new Set(
    queryClient
      .getQueryCache()
      .findAll({ type: 'active' })
      .map((query) => getMessageBookingId(query.queryKey))
      .filter((bookingId): bookingId is string => bookingId !== undefined),
  )
  const targets =
    bookingIds === undefined
      ? [...activeBookingIds]
      : bookingIds.filter((bookingId) => activeBookingIds.has(bookingId))

  await Promise.all(
    targets.map((bookingId) => synchronizeBookingMessages(queryClient, bookingId)),
  )
}

function getChangedBookingId(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const bookingId = (payload as { bookingId?: unknown }).bookingId
  return typeof bookingId === 'string' && bookingId.length > 0
    ? bookingId
    : undefined
}

function getMessageBookingId(queryKey: readonly unknown[]): string | undefined {
  return queryKey[0] === 'chat' &&
    queryKey[1] === 'booking' &&
    typeof queryKey[2] === 'string' &&
    queryKey[3] === 'messages'
    ? queryKey[2]
    : undefined
}

function isBookingContextQuery(queryKey: readonly unknown[]): boolean {
  return (
    queryKey[0] === 'chat' &&
    queryKey[1] === 'booking' &&
    typeof queryKey[2] === 'string' &&
    queryKey.length === 3
  )
}
