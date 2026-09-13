import type {
  ChatBookingContextDto,
  ChatConversationDto,
  ChatMessageDto,
  ChatMessageListDto,
  ChatReadStateDto,
  ChatSummaryDto,
  CreateChatMessageDto,
} from '@/api/generated'

export type ChatBookingContext = ChatBookingContextDto
export type ChatConversation = ChatConversationDto
export type ChatMessage = ChatMessageDto
/**
 * `synchronizedThroughSequence` is client cache metadata. It records the
 * highest sequence fetched through the ordered `afterSequence` sync path; it
 * is deliberately separate from the server's `lastSequence` field.
 */
export type ChatMessageList = ChatMessageListDto & {
  synchronizedThroughSequence?: number
}
export type ChatReadState = ChatReadStateDto
export type ChatSummary = ChatSummaryDto
export type SendChatMessageInput = CreateChatMessageDto

export interface ChatConversationListQuery {
  limit: number
  needsReply?: boolean
  page: number
  search?: string
  unread?: boolean
}

export interface ChatMessagesQuery {
  afterSequence?: number
  beforeSequence?: number
  limit?: number
}
