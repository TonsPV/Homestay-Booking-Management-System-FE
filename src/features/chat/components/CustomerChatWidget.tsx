/**
 * THESIS: Booking support should feel like a familiar messenger, with the
 * stay context always visible beside the conversation it belongs to.
 * OWN-WORLD: Homi blue anchors one calm workspace; muted canvas separates
 * threads from messages without stacking white cards inside white cards.
 * STORY: A guest opens the chat bubble, scans their booking threads, then
 * continues the selected exchange without leaving the page they were using.
 * FIRST VIEWPORT: Desktop opens a two-column chat window; mobile moves from
 * the thread list into the selected conversation.
 * FORM: Booking-centric messenger workspace for the customer surface.
 */
import {
  BedDouble,
  ChevronRight,
  MessageCircle,
  MessagesSquare,
  Minus,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { appConfig } from '@/app/config'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { cn } from '@/shared/components/cn'
import { ErrorState, LoadingState } from '@/shared/components/Feedback'
import { Input } from '@/shared/components/FormControls'
import { IconButton } from '@/shared/components/IconButton'
import { formatDateTime } from '@/shared/formatting/formatters'

import { useCustomerChatWidget } from '../customer-chat-widget-context'
import { useChatConversations, useChatSummary } from '../hooks'
import type { ChatConversation } from '../types'
import { ChatPanel } from './ChatPanel'

function ConversationPreview({
  conversation,
  onSelect,
  selected,
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
        'group flex w-full items-start gap-3 border-b border-line px-3 py-3.5 text-left transition duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand motion-reduce:transition-none',
        selected && 'bg-brand-soft/65 ring-1 ring-inset ring-brand/35',
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand-strong"
      >
        <BedDouble className="size-5" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-ink">
              {conversation.booking.roomName}
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-muted">
              Phòng {conversation.booking.roomNumber} · {conversation.booking.bookingCode}
            </span>
          </span>
          {conversation.unreadCount > 0 ? (
            <Badge className="shrink-0" tone="blue">
              {conversation.unreadCount}
            </Badge>
          ) : null}
        </span>
        {preview ? (
          <>
            <span className="mt-2 block truncate text-sm text-muted">
              {preview.content}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {formatDateTime(preview.createdAt)}
            </span>
          </>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="mt-3 size-4 shrink-0 text-muted sm:hidden"
      />
    </button>
  )
}

function ChatWindow() {
  const {
    close,
    minimize,
    openBooking,
    openInbox,
    selectedBookingId,
  } = useCustomerChatWidget()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const conversationsQuery = useChatConversations({
    limit: 30,
    page: 1,
    search: search || undefined,
  })
  const conversations = conversationsQuery.data?.data ?? []
  const mostRecentBookingId = conversations[0]?.booking.id

  useEffect(() => {
    if (
      selectedBookingId ||
      !mostRecentBookingId ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      !window.matchMedia('(min-width: 640px)').matches
    ) {
      return
    }

    openBooking(mostRecentBookingId)
  }, [mostRecentBookingId, openBooking, selectedBookingId])

  return (
    <section
      aria-label="Hộp thư hỗ trợ booking"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-canvas"
    >
      <header className="flex min-h-14 items-center gap-3 bg-brand px-4 text-white">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-control bg-white/14"
        >
          <MessagesSquare className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">Trao đổi booking</h2>
          <p className="mt-0.5 truncate text-xs text-white/75">
            Chọn cuộc thoại để tiếp tục trao đổi
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label="Thu gọn cửa sổ chat"
            className="text-white hover:bg-white/14 hover:text-white focus-visible:outline-white"
            onClick={minimize}
            size="sm"
          >
            <Minus aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            aria-label="Đóng cửa sổ chat"
            className="text-white hover:bg-white/14 hover:text-white focus-visible:outline-white"
            onClick={close}
            size="sm"
          >
            <X aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section
          aria-label="Danh sách hội thoại"
          className={cn(
            'min-h-0 w-full flex-col border-line bg-surface sm:flex sm:w-60 sm:shrink-0 sm:border-r',
            selectedBookingId ? 'hidden sm:flex' : 'flex',
          )}
        >
          <form
            className="border-b border-line bg-surface px-3 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(searchInput.trim())
            }}
          >
            <label className="sr-only" htmlFor="floating-chat-search">
              Tìm theo mã booking
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                className="min-h-10 border-line bg-canvas pl-9 py-2 text-sm shadow-none"
                id="floating-chat-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm booking"
                value={searchInput}
              />
            </div>
          </form>

          <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
            {conversationsQuery.isPending ? (
              <LoadingState label="Đang tải cuộc thoại…" />
            ) : null}
            {conversationsQuery.isError ? (
              <div className="p-3">
                <ErrorState
                  description="Không thể tải các trao đổi về booking."
                  onRetry={() => void conversationsQuery.refetch()}
                  title="Chưa tải được hộp thư"
                />
              </div>
            ) : null}
            {!conversationsQuery.isPending &&
            !conversationsQuery.isError &&
            conversations.length === 0 ? (
              <div className="grid min-h-56 place-items-center px-6 py-8 text-center">
                <div>
                  <span
                    aria-hidden="true"
                    className="mx-auto grid size-11 place-items-center rounded-control bg-brand-soft text-brand-strong"
                  >
                    <MessageCircle className="size-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-ink">
                    Chưa có cuộc thoại
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Mở chi tiết booking để bắt đầu trao đổi.
                  </p>
                </div>
              </div>
            ) : null}
            {conversations.map((conversation) => (
              <ConversationPreview
                conversation={conversation}
                key={conversation.id}
                onSelect={() => openBooking(conversation.booking.id)}
                selected={selectedBookingId === conversation.booking.id}
              />
            ))}
          </div>
        </section>

        <section
          aria-label="Chi tiết hội thoại"
          className={cn(
            'min-w-0 flex-1 bg-canvas sm:flex',
            selectedBookingId ? 'flex' : 'hidden sm:flex',
          )}
        >
          {selectedBookingId ? (
            <ChatPanel
              bookingHref={`/bookings/${selectedBookingId}`}
              bookingId={selectedBookingId}
              className="h-full min-h-0 w-full"
              embedded
              floating
              onBack={openInbox}
              onBookingLink={close}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-canvas/75 px-8 text-center">
              <div>
                <span
                  aria-hidden="true"
                  className="mx-auto grid size-12 place-items-center rounded-card bg-brand-soft text-brand-strong"
                >
                  <MessageCircle className="size-6" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">
                  Chọn một cuộc thoại
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
                  Danh sách booking nằm ở bên trái.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export function CustomerChatWidget() {
  const { principal } = useAuth()
  const { close, isMinimized, isOpen, openBooking, openInbox, selectedBookingId } =
    useCustomerChatWidget()
  const summary = useChatSummary()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const hadOpenWindowRef = useRef(false)
  const unreadCount = summary.data?.unreadMessageCount ?? 0
  const canShow =
    appConfig.chatEnabled && principal?.actorType === 'customer'
  const isWindowOpen = isOpen && !isMinimized

  useEffect(() => {
    if (!canShow || !isWindowOpen) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [canShow, close, isWindowOpen])

  useEffect(() => {
    if (!canShow) {
      hadOpenWindowRef.current = false
      return
    }

    if (isWindowOpen) {
      hadOpenWindowRef.current = true
      return
    }

    if (hadOpenWindowRef.current) {
      hadOpenWindowRef.current = false
      launcherRef.current?.focus()
    }
  }, [canShow, isWindowOpen])

  if (!canShow) {
    return null
  }

  return (
    <>
      {!isWindowOpen ? (
        <button
          aria-label={
            unreadCount > 0
              ? `Mở hỗ trợ booking, ${unreadCount} tin chưa đọc`
              : 'Mở hỗ trợ booking'
          }
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-[50] grid size-14 place-items-center rounded-full bg-brand text-white shadow-elevation-4 transition duration-base ease-calm hover:-translate-y-0.5 hover:bg-brand-strong hover:shadow-elevation-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand motion-reduce:transform-none motion-reduce:transition-none"
          onClick={selectedBookingId ? () => openBooking(selectedBookingId) : openInbox}
          ref={launcherRef}
          type="button"
        >
          <MessageCircle aria-hidden="true" className="size-6" strokeWidth={2.25} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-surface bg-danger px-1 text-[11px] font-black leading-none text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {isWindowOpen ? (
        <aside
          aria-label="Cửa sổ hỗ trợ booking"
          className="fixed inset-0 z-modal flex bg-canvas sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(42rem,calc(100dvh-2.5rem))] sm:w-[min(50rem,calc(100vw-2.5rem))] sm:overflow-hidden sm:rounded-panel sm:border sm:border-line sm:shadow-elevation-4"
        >
          <ChatWindow />
        </aside>
      ) : null}
    </>
  )
}
