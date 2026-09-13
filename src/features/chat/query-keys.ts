import type { ChatConversationListQuery, ChatMessagesQuery } from './types'

export const chatKeys = {
  all: ['chat'] as const,
  booking: (bookingId: string) =>
    [...chatKeys.all, 'booking', bookingId] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversationList: (query: ChatConversationListQuery) =>
    [...chatKeys.conversations(), query] as const,
  messagePrefix: (bookingId: string) =>
    [...chatKeys.booking(bookingId), 'messages'] as const,
  messages: (bookingId: string, query: ChatMessagesQuery = {}) =>
    [...chatKeys.messagePrefix(bookingId), query] as const,
  summary: () => [...chatKeys.all, 'summary'] as const,
}
