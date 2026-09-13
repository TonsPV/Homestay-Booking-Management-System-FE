import type { QueryClient } from '@tanstack/react-query'

import { chatApi } from './api'
import { mergeChatMessageLists } from './message-cache'
import { chatKeys } from './query-keys'
import type { ChatMessageList } from './types'

/**
 * Replays only the contiguous range after the REST-confirmed cache cursor.
 * A POST response may carry a later sequence while a socket event was missed.
 */
export async function synchronizeBookingMessages(
  queryClient: QueryClient,
  bookingId: string,
) {
  const messageQueryKey = chatKeys.messagePrefix(bookingId)
  const cachedPages = queryClient.getQueriesData<ChatMessageList>({
    queryKey: messageQueryKey,
  })
  const cachedSyncCursors = cachedPages.map(([, page]) =>
    page ? getCachedSyncCursor(page) : 0,
  )
  let afterSequence =
    cachedSyncCursors.length > 0 ? Math.min(...cachedSyncCursors) : 0

  for (;;) {
    const incoming = await chatApi.listMessages(bookingId, {
      afterSequence,
      limit: 100,
    })
    const nextSequence = getContiguousSequence(
      afterSequence,
      incoming.messages.map((message) => message.sequence),
    )

    queryClient.setQueriesData<ChatMessageList>(
      { queryKey: messageQueryKey },
      (current) =>
        current
          ? mergeChatMessageLists(current, incoming, {
              hasMoreBefore: current.hasMoreBefore,
              synchronizedThroughSequence: nextSequence,
            })
          : current,
    )

    if (nextSequence <= afterSequence || nextSequence >= incoming.lastSequence) {
      return
    }

    afterSequence = nextSequence
  }
}

function getContiguousSequence(
  afterSequence: number,
  sequences: readonly number[],
) {
  let contiguousSequence = afterSequence

  for (const sequence of [...sequences].sort((left, right) => left - right)) {
    if (sequence === contiguousSequence + 1) {
      contiguousSequence = sequence
      continue
    }

    if (sequence > contiguousSequence + 1) {
      return contiguousSequence
    }
  }

  return contiguousSequence
}

function getCachedSyncCursor(page: ChatMessageList) {
  const reportedCursor =
    page.synchronizedThroughSequence ?? page.lastSequence
  const contiguousCachedSequence = getLastSequenceBeforeCachedGap(
    page.messages.map((message) => message.sequence),
  )

  return Math.min(reportedCursor, contiguousCachedSequence)
}

function getLastSequenceBeforeCachedGap(sequences: readonly number[]) {
  const sorted = [...new Set(sequences)].sort((left, right) => left - right)

  if (sorted.length === 0) {
    return Number.POSITIVE_INFINITY
  }

  let previousSequence = sorted[0]

  for (const sequence of sorted.slice(1)) {
    if (sequence > previousSequence + 1) {
      return previousSequence
    }

    previousSequence = sequence
  }

  return previousSequence
}
