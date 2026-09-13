import { apiRequest } from '@/api/client'
import type {
  ChatBookingContextDto,
  ChatConversationDto,
  ChatMessageDto,
  ChatMessageListDto,
  ChatReadStateDto,
  ChatSummaryDto,
} from '@/api/generated'

import type {
  ChatConversationListQuery,
  ChatMessagesQuery,
  SendChatMessageInput,
} from './types'

export const chatApi = {
  async getBookingContext(bookingId: string, signal?: AbortSignal) {
    const result = await apiRequest<ChatBookingContextDto>(
      `/chat/bookings/${bookingId}`,
      { signal },
    )
    return result.data
  },

  async getSummary(signal?: AbortSignal) {
    const result = await apiRequest<ChatSummaryDto>('/chat/summary', { signal })
    return result.data
  },

  listConversations(query: ChatConversationListQuery, signal?: AbortSignal) {
    return apiRequest<ChatConversationDto[]>('/chat/conversations', {
      query: { ...query },
      signal,
    })
  },

  async listMessages(
    bookingId: string,
    query: ChatMessagesQuery,
    signal?: AbortSignal,
  ) {
    const result = await apiRequest<ChatMessageListDto>(
      `/chat/bookings/${bookingId}/messages`,
      { query: { ...query }, signal },
    )
    return result.data
  },

  async markRead(bookingId: string, lastReadSequence: number) {
    const result = await apiRequest<ChatReadStateDto>(
      `/chat/bookings/${bookingId}/read`,
      {
        body: { lastReadSequence },
        method: 'PUT',
      },
    )
    return result.data
  },

  async sendMessage(bookingId: string, input: SendChatMessageInput) {
    const result = await apiRequest<ChatMessageDto>(
      `/chat/bookings/${bookingId}/messages`,
      {
        body: input,
        method: 'POST',
      },
    )
    return result.data
  },
}
