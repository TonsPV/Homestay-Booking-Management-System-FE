import { cn } from '@/shared/components/cn'

import { useChatSummary } from '../hooks'

interface ChatUnreadBadgeProps {
  className?: string
  mode?: 'needsReply' | 'unread'
}

/** Rendered only while chat is enabled, so non-chat shells stay data-free. */
export function ChatUnreadBadge({
  className,
  mode = 'unread',
}: ChatUnreadBadgeProps) {
  const summary = useChatSummary()
  const count =
    mode === 'needsReply'
      ? (summary.data?.needsReplyConversationCount ??
        summary.data?.unreadMessageCount ??
        0)
      : (summary.data?.unreadMessageCount ?? 0)

  if (count === 0) {
    return null
  }

  return (
    <span
      aria-label={`${count} unread chat items`}
      className={cn(
        'rounded-full bg-brand px-1.5 py-0.5 text-xs font-black text-white',
        className,
      )}
    >
      {count}
    </span>
  )
}
