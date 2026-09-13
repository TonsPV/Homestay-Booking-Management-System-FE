/**
 * THESIS: Booking support stays one tap away, carrying the room context instead
 * of making a guest reconstruct which stay a message belongs to.
 * OWN-WORLD: Restrained Homi Stay blue, white surfaces, crisp booking labels,
 * and a single soft-elevation floating window.
 * STORY: A customer opens their support thread, recognizes the booked room,
 * and returns to the full inbox only when they need broader history.
 * FIRST VIEWPORT: A circular chat launcher anchors the lower-right corner;
 * its expanded window puts booking threads before message history.
 * FORM: Operate-mode messenger widget, extending the existing customer surface.
 */
import {
  BedDouble,
  ChevronRight,
  MessageCircle,
  MessagesSquare,
  Minus,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { appConfig } from '@/app/config'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { ErrorState, LoadingState } from '@/shared/components/Feedback'
import { IconButton } from '@/shared/components/IconButton'
import { formatDateTime } from '@/shared/formatting/formatters'

import { useCustomerChatWidget } from '../customer-chat-widget-context'
import { useChatConversations, useChatSummary } from '../hooks'
import type { ChatConversation } from '../types'
import { ChatPanel } from './ChatPanel'

function ConversationPreview({
  conversation,
  onSelect,
}: {
  conversation: ChatConversation
  onSelect: () => void
}) {
  const preview = conversation.lastMessage

  return (
    <button
      className="group flex w-full items-start gap-3 border-b border-line px-4 py-4 text-left transition duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand motion-reduce:transition-none"
      onClick={onSelect}
      type="button"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-card bg-brand-soft text-brand-strong"
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
        className="mt-3 size-4 shrink-0 text-muted transition duration-fast ease-calm group-hover:translate-x-0.5 group-hover:text-brand-strong motion-reduce:transition-none"
      />
    </button>
  )
}

function WidgetInbox() {
  const { close, minimize, openBooking } = useCustomerChatWidget()
  const conversationsQuery = useChatConversations({ limit: 20, page: 1 })
  const conversations = conversationsQuery.data?.data ?? []

  return (
    <section
      aria-label="Hộp thư hỗ trợ booking"
      className="flex h-full min-h-0 flex-col bg-surface"
    >
      <header className="flex min-h-16 items-center gap-3 bg-brand px-4 text-white">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-control bg-white/14"
        >
          <MessagesSquare className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">Hỗ trợ booking</h2>
          <p className="mt-0.5 text-xs text-white/75">
            Chọn phòng để tiếp tục trao đổi
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            aria-label="Thu gọn cửa sổ chat"
            className="text-white hover:bg-white/14 hover:text-white"
            onClick={minimize}
            size="sm"
          >
            <Minus aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            aria-label="Đóng cửa sổ chat"
            className="text-white hover:bg-white/14 hover:text-white"
            onClick={close}
            size="sm"
          >
            <X aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversationsQuery.isPending ? (
          <LoadingState label="Đang tải các trao đổi…" />
        ) : null}
        {conversationsQuery.isError ? (
          <div className="p-4">
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
          <div className="grid min-h-64 place-items-center px-7 py-10 text-center">
            <div>
              <span
                aria-hidden="true"
                className="mx-auto grid size-12 place-items-center rounded-card bg-brand-soft text-brand-strong"
              >
                <MessageCircle className="size-6" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">
                Chưa có trao đổi nào
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Mở chi tiết booking để bắt đầu trao đổi với đội hỗ trợ.
              </p>
            </div>
          </div>
        ) : null}
        {conversations.map((conversation) => (
          <ConversationPreview
            conversation={conversation}
            key={conversation.id}
            onSelect={() => openBooking(conversation.booking.id)}
          />
        ))}
      </div>

      <footer className="border-t border-line bg-canvas/55 p-3">
        <Link
          className="flex min-h-11 items-center justify-center rounded-control px-3 text-sm font-bold text-brand-strong transition duration-fast ease-calm hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
          onClick={close}
          to="/messages"
        >
          Mở hộp thư đầy đủ
          <ChevronRight aria-hidden="true" className="ml-1 size-4" />
        </Link>
      </footer>
    </section>
  )
}

export function CustomerChatWidget() {
  const { principal } = useAuth()
  const { pathname } = useLocation()
  const {
    close,
    isMinimized,
    isOpen,
    minimize,
    openBooking,
    openInbox,
    selectedBookingId,
  } = useCustomerChatWidget()
  const summary = useChatSummary()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const hadOpenWindowRef = useRef(false)
  const unreadCount = summary.data?.unreadMessageCount ?? 0
  const canShow =
    appConfig.chatEnabled &&
    principal?.actorType === 'customer' &&
    pathname !== '/messages'
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

  useEffect(() => {
    if (pathname === '/messages') {
      close()
    }
  }, [close, pathname])

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
          className="fixed inset-0 z-modal flex bg-surface sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(42rem,calc(100dvh-2.5rem))] sm:w-[min(25rem,calc(100vw-2.5rem))] sm:overflow-hidden sm:rounded-panel sm:border sm:border-line sm:shadow-elevation-4"
        >
          {selectedBookingId ? (
            <ChatPanel
              bookingHref={`/bookings/${selectedBookingId}`}
              bookingId={selectedBookingId}
              className="h-full min-h-0 w-full rounded-none border-0 shadow-none"
              floating
              onBack={openInbox}
              onBookingLink={close}
              onClose={close}
              onMinimize={minimize}
            />
          ) : (
            <WidgetInbox />
          )}
        </aside>
      ) : null}
    </>
  )
}
