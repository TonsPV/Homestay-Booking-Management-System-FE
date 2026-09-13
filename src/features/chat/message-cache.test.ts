import { describe, expect, it } from 'vitest'

import {
  appendSentChatMessage,
  mergeChatMessageLists,
} from './message-cache'

describe('mergeChatMessageLists', () => {
  it('keeps old history, deduplicates messages, and preserves chronological order', () => {
    const result = mergeChatMessageLists(
      {
        conversationId: '1',
        hasMoreBefore: true,
        lastSequence: 4,
        messages: [message('1', 3), message('2', 4)],
      },
      {
        conversationId: '1',
        hasMoreBefore: false,
        lastSequence: 6,
        messages: [message('2', 4), message('3', 5), message('4', 6)],
      },
      { hasMoreBefore: true },
    )

    expect(result).toMatchObject({
      conversationId: '1',
      hasMoreBefore: true,
      lastSequence: 6,
    })
    expect(result.messages.map((item) => item.sequence)).toEqual([3, 4, 5, 6])
  })

  it('keeps the ordered sync cursor behind a POST response that skips a cached sequence', () => {
    const result = appendSentChatMessage(
      {
        conversationId: '1',
        hasMoreBefore: false,
        lastSequence: 10,
        messages: [message('10', 10)],
        synchronizedThroughSequence: 10,
      },
      message('12', 12),
    )

    expect(result.lastSequence).toBe(12)
    expect(result.synchronizedThroughSequence).toBe(10)
    expect(result.messages.map((item) => item.sequence)).toEqual([10, 12])
  })

  it('keeps a cursor advanced by a delta merge when React Query structurally merges it again', () => {
    const result = mergeChatMessageLists(
      {
        conversationId: '1',
        hasMoreBefore: false,
        lastSequence: 10,
        messages: [message('10', 10)],
        synchronizedThroughSequence: 10,
      },
      {
        conversationId: '1',
        hasMoreBefore: false,
        lastSequence: 12,
        messages: [message('11', 11), message('12', 12)],
        synchronizedThroughSequence: 12,
      },
    )

    expect(result.synchronizedThroughSequence).toBe(12)
  })
})

function message(id: string, sequence: number) {
  return {
    content: `message-${sequence}`,
    createdAt: '2026-09-13T00:00:00.000Z',
    id,
    senderActorId: '7',
    senderActorType: 'customer' as const,
    senderName: 'Khách hàng',
    sequence,
  }
}
