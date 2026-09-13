import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appConfig } from '@/app/config'
import { useAuth } from '@/auth/useAuth'

import { chatApi } from './api'
import {
  appendSentChatMessage,
  initializeChatMessageList,
  mergeChatMessageLists,
} from './message-cache'
import { chatKeys } from './query-keys'
import type {
  ChatConversationListQuery,
  ChatMessageList,
  ChatMessagesQuery,
  SendChatMessageInput,
} from './types'

export function useChatConversations(query: ChatConversationListQuery) {
  return useQuery({
    enabled: appConfig.chatEnabled,
    queryFn: ({ signal }) => chatApi.listConversations(query, signal),
    queryKey: chatKeys.conversationList(query),
  })
}

export function useChatSummary() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    enabled: appConfig.chatEnabled && isAuthenticated,
    queryFn: ({ signal }) => chatApi.getSummary(signal),
    queryKey: chatKeys.summary(),
  })
}

export function useChatBookingContext(bookingId: string | undefined) {
  return useQuery({
    enabled: appConfig.chatEnabled && Boolean(bookingId),
    queryFn: ({ signal }) => chatApi.getBookingContext(bookingId ?? '', signal),
    queryKey: chatKeys.booking(bookingId ?? 'missing'),
  })
}

export function useChatMessages(
  bookingId: string | undefined,
  query: ChatMessagesQuery = {},
) {
  return useQuery<ChatMessageList>({
    enabled: appConfig.chatEnabled && Boolean(bookingId),
    queryFn: ({ signal }) =>
      chatApi.listMessages(bookingId ?? '', query, signal),
    queryKey: chatKeys.messages(bookingId ?? 'missing', query),
    structuralSharing: (current, incoming) => {
      const next = incoming as ChatMessageList
      const previous = current as ChatMessageList | undefined

      return previous
        ? mergeChatMessageLists(previous, next, {
            hasMoreBefore: previous.hasMoreBefore,
          })
        : initializeChatMessageList(next)
    },
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      bookingId,
      input,
    }: {
      bookingId: string
      input: SendChatMessageInput
    }) => chatApi.sendMessage(bookingId, input),
    onSuccess: (message, { bookingId }) => {
      queryClient.setQueriesData<ChatMessageList>(
        { queryKey: chatKeys.messagePrefix(bookingId) },
        (current) =>
          current ? appendSentChatMessage(current, message) : current,
      )
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      })
      void queryClient.invalidateQueries({ queryKey: chatKeys.summary() })
      void queryClient.invalidateQueries({
        queryKey: chatKeys.booking(bookingId),
      })
    },
  })
}

export function useLoadOlderChatMessages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      beforeSequence,
      bookingId,
    }: {
      beforeSequence: number
      bookingId: string
    }) => chatApi.listMessages(bookingId, { beforeSequence, limit: 50 }),
    onSuccess: (messages, { bookingId }) => {
      queryClient.setQueriesData<ChatMessageList>(
        { queryKey: chatKeys.messagePrefix(bookingId) },
        (current) =>
          current ? mergeChatMessageLists(current, messages) : current,
      )
    },
  })
}

export function useMarkChatRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      bookingId,
      lastReadSequence,
    }: {
      bookingId: string
      lastReadSequence: number
    }) => chatApi.markRead(bookingId, lastReadSequence),
    onSuccess: (_readState, { bookingId }) => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      })
      void queryClient.invalidateQueries({ queryKey: chatKeys.summary() })
      void queryClient.invalidateQueries({
        queryKey: chatKeys.booking(bookingId),
      })
    },
  })
}
