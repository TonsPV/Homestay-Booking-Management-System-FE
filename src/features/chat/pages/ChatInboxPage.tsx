import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { appConfig } from '@/app/config'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { cn } from '@/shared/components/cn'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/Feedback'
import { Input } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatDateOnly, formatDateTime } from '@/shared/formatting/formatters'

import { ChatPanel } from '../components/ChatPanel'
import { useChatConversations } from '../hooks'
import type { ChatConversation, ChatConversationListQuery } from '../types'

function bookingPath(conversation: ChatConversation, workspace: 'customer' | 'management' | 'staff') {
  if (workspace === 'customer') {
    return `/bookings/${conversation.booking.id}`
  }

  return `/${workspace}/bookings/${conversation.booking.id}`
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ChatConversation
  onSelect: () => void
  selected: boolean
}) {
  const preview = conversation.lastMessage

  return (
    <button
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'w-full border-b border-line px-4 py-4 text-left transition duration-fast ease-calm last:border-b-0 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand motion-reduce:transition-none',
        selected && 'bg-brand-soft',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">
            {conversation.booking.bookingCode}
          </p>
          <p className="mt-1 truncate text-xs text-muted">
            Phòng {conversation.booking.roomNumber} · {formatDateOnly(conversation.booking.checkInDate)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {conversation.needsReply ? <Badge tone="amber">Cần trả lời</Badge> : null}
          {conversation.unreadCount > 0 ? (
            <Badge tone="blue">{conversation.unreadCount}</Badge>
          ) : null}
        </div>
      </div>
      {preview ? (
        <>
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">
            {preview.content}
          </p>
          <p className="mt-2 text-xs text-muted">{formatDateTime(preview.createdAt)}</p>
        </>
      ) : null}
    </button>
  )
}

export function ChatInboxPage() {
  const { principal } = useAuth()
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false)
  const workspace =
    principal?.actorType === 'customer'
      ? 'customer'
      : principal?.role === 'STAFF'
        ? 'staff'
        : 'management'
  const query = useMemo<ChatConversationListQuery>(
    () => ({
      limit: 50,
      needsReply: workspace === 'customer' ? undefined : needsReplyOnly || undefined,
      page: 1,
      search: search || undefined,
      unread: unreadOnly || undefined,
    }),
    [needsReplyOnly, search, unreadOnly, workspace],
  )
  const conversationsQuery = useChatConversations(query)
  const conversations = conversationsQuery.data?.data ?? []
  const selectedConversation = conversations.find(
    (conversation) => conversation.booking.id === selectedBookingId,
  )

  if (!appConfig.chatEnabled) {
    return (
      <EmptyState
        description="Tính năng trao đổi về booking hiện chưa được bật."
        title="Trao đổi chưa sẵn sàng"
      />
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        description={
          workspace === 'customer'
            ? 'Theo dõi trao đổi với đội ngũ hỗ trợ cho từng booking.'
            : 'Hộp thư chung cho các trao đổi đang gắn với booking.'
        }
        title="Tin nhắn booking"
      />

      <div className="grid min-h-[38rem] overflow-hidden rounded-panel border border-line bg-surface shadow-card lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section
          aria-label="Danh sách hội thoại"
          className={cn(
            'min-h-0 border-r border-line lg:block',
            selectedBookingId && 'hidden lg:block',
          )}
        >
          <form
            className="border-b border-line p-4"
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(searchInput.trim())
            }}
          >
            <label className="sr-only" htmlFor="chat-booking-search">
              Tìm theo mã booking
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                className="pl-9"
                id="chat-booking-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm mã booking"
                value={searchInput}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                aria-pressed={unreadOnly}
                className="min-h-9 px-3 py-1.5"
                onClick={() => setUnreadOnly((current) => !current)}
                variant={unreadOnly ? 'secondary' : 'outline'}
              >
                Chưa đọc
              </Button>
              {workspace !== 'customer' ? (
                <Button
                  aria-pressed={needsReplyOnly}
                  className="min-h-9 px-3 py-1.5"
                  onClick={() => setNeedsReplyOnly((current) => !current)}
                  variant={needsReplyOnly ? 'secondary' : 'outline'}
                >
                  Cần trả lời
                </Button>
              ) : null}
            </div>
          </form>

          <div className="max-h-[34rem] overflow-y-auto lg:max-h-[calc(100vh-18rem)]">
            {conversationsQuery.isPending ? <LoadingState label="Đang tải hộp thư…" /> : null}
            {conversationsQuery.isError ? (
              <div className="p-4">
                <ErrorState
                  description="Không thể tải hộp thư. Vui lòng thử lại."
                  onRetry={() => void conversationsQuery.refetch()}
                />
              </div>
            ) : null}
            {!conversationsQuery.isPending &&
            !conversationsQuery.isError &&
            conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  description="Các cuộc trao đổi sẽ xuất hiện sau khi có tin nhắn đầu tiên."
                  title="Chưa có hội thoại"
                />
              </div>
            ) : null}
            {conversations.map((conversation) => (
              <ConversationRow
                conversation={conversation}
                key={conversation.id}
                onSelect={() => setSelectedBookingId(conversation.booking.id)}
                selected={selectedBookingId === conversation.booking.id}
              />
            ))}
          </div>
        </section>

        <section
          className={cn(
            'min-w-0 p-0 lg:block',
            selectedBookingId ? 'block' : 'hidden lg:block',
          )}
        >
          {selectedBookingId ? (
            <ChatPanel
              bookingHref={
                selectedConversation
                  ? bookingPath(selectedConversation, workspace)
                  : undefined
              }
              bookingId={selectedBookingId}
              className="h-full rounded-none border-0 shadow-none"
              onBack={() => setSelectedBookingId(null)}
            />
          ) : (
            <div className="grid h-full min-h-80 place-items-center p-6 text-center">
              <div>
                <p className="text-lg font-bold text-ink">Chọn một hội thoại</p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                  Chọn booking ở bên trái để xem lịch sử và tiếp tục trao đổi.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  )
}
