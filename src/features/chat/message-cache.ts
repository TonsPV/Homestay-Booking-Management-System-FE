import type { ChatMessage, ChatMessageList } from './types'

interface MergeChatMessageOptions {
  hasMoreBefore?: boolean
  synchronizedThroughSequence?: number
}

/** Adds a POST-confirmed message without moving the ordered sync cursor. */
export function appendSentChatMessage(
  current: ChatMessageList,
  message: ChatMessage,
): ChatMessageList {
  if (current.messages.some((item) => item.id === message.id)) {
    return current
  }

  return {
    ...current,
    lastSequence: Math.max(current.lastSequence, message.sequence),
    messages: [...current.messages, message].sort(
      (left, right) => left.sequence - right.sequence,
    ),
  }
}

/** Seeds an ordered-sync cursor from an initial REST snapshot. */
export function initializeChatMessageList(
  incoming: ChatMessageList,
): ChatMessageList {
  return {
    ...incoming,
    synchronizedThroughSequence: incoming.lastSequence,
  }
}

/** Merges a REST page without trusting an invalidation signal to carry data. */
export function mergeChatMessageLists(
  current: ChatMessageList,
  incoming: ChatMessageList,
  options: MergeChatMessageOptions = {},
): ChatMessageList {
  const messages = new Map(
    current.messages.map((message) => [message.id, message]),
  )

  for (const message of incoming.messages) {
    messages.set(message.id, message)
  }

  const synchronizedThroughSequence =
    options.synchronizedThroughSequence ??
    maximumDefinedSequence(
      current.synchronizedThroughSequence,
      incoming.synchronizedThroughSequence,
    )

  return {
    ...current,
    conversationId: incoming.conversationId ?? current.conversationId,
    hasMoreBefore: options.hasMoreBefore ?? incoming.hasMoreBefore,
    lastSequence: Math.max(current.lastSequence, incoming.lastSequence),
    messages: [...messages.values()].sort(
      (left, right) => left.sequence - right.sequence,
    ),
    ...(synchronizedThroughSequence === undefined
      ? {}
      : { synchronizedThroughSequence }),
  }
}

function maximumDefinedSequence(...sequences: Array<number | undefined>) {
  const definedSequences = sequences.filter(
    (sequence): sequence is number => sequence !== undefined,
  )

  return definedSequences.length > 0
    ? Math.max(...definedSequences)
    : undefined
}
