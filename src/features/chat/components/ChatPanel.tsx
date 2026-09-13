import { BedDouble, Minus, SendHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { appConfig } from '@/app/config'
import { readAuthSession } from '@/auth/session-storage'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/components/cn'
import { Alert, ErrorState, LoadingState } from '@/shared/components/Feedback'
import { Textarea } from '@/shared/components/FormControls'
import { IconButton } from '@/shared/components/IconButton'
import { formatDateOnly, formatDateTime } from '@/shared/formatting/formatters'

import {
  useChatBookingContext,
  useLoadOlderChatMessages,
  useChatMessages,
  useMarkChatRead,
  useSendChatMessage,
} from '../hooks'
import type { ChatBookingContext, ChatMessage } from '../types'

interface ChatScope {
  actorKey: string | null
  bookingId: string
  sessionKey: string | null
}

interface PendingMessage extends ChatScope {
  clientMessageId: string
  content: string
  state: 'error' | 'sending'
}

interface ChatPanelProps {
  bookingId: string
  bookingHref?: string
  className?: string
  embedded?: boolean
  floating?: boolean
  onBack?: () => void
  onBookingLink?: () => void
  onClose?: () => void
  onMinimize?: () => void
}

const bookingStatusLabels: Record<string, string> = {
  CANCELLED: 'Đã hủy',
  CHECKED_IN: 'Đã nhận phòng',
  CHECKED_OUT: 'Đã trả phòng',
  CONFIRMED: 'Đã xác nhận',
  PENDING_PAYMENT: 'Chờ thanh toán',
}

function getBookingStatusTone(status: string) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'amber' as const
    case 'CONFIRMED':
      return 'blue' as const
    case 'CHECKED_IN':
      return 'emerald' as const
    case 'CANCELLED':
      return 'rose' as const
    default:
      return 'slate' as const
  }
}

function BookingAttachment({
  booking,
  bookingHref,
  embedded = false,
  onBookingLink,
}: {
  booking: ChatBookingContext['booking']
  bookingHref?: string
  embedded?: boolean
  onBookingLink?: () => void
}) {
  return (
    <section
      aria-label="Booking đang trao đổi"
      className={cn(
        'border-b border-line',
        embedded
          ? 'bg-brand-soft/35 px-3 py-2.5'
          : 'bg-canvas/45 px-4 py-3 sm:px-5',
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3',
          embedded
            ? 'p-0'
            : 'rounded-card border border-line bg-surface p-3 shadow-elevation-1',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid shrink-0 place-items-center rounded-control bg-brand-soft text-brand-strong',
            embedded ? 'size-9' : 'size-10',
          )}
        >
          <BedDouble className={embedded ? 'size-4' : 'size-5'} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {booking.roomName}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-muted">
                Phòng {booking.roomNumber} · {booking.bookingCode}
              </p>
            </div>
            <Badge className="shrink-0" tone={getBookingStatusTone(booking.status)}>
              {bookingStatusLabels[booking.status] ?? booking.status}
            </Badge>
          </div>
          <p className={cn('text-xs leading-5 text-muted', embedded ? 'mt-1' : 'mt-2')}>
            {formatDateOnly(booking.checkInDate)} –{' '}
            {formatDateOnly(booking.checkOutDate)}
          </p>
          {bookingHref ? (
            <Link
              className={cn(
                'inline-flex text-xs font-bold text-brand-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                embedded ? 'mt-1' : 'mt-2',
              )}
              onClick={onBookingLink}
              to={bookingHref}
            >
              Xem chi tiết booking
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function createClientMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function hasSameScope(left: ChatScope, right: ChatScope) {
  return (
    left.bookingId === right.bookingId &&
    left.actorKey === right.actorKey &&
    left.sessionKey === right.sessionKey
  )
}

function isSamePendingMessage(
  pending: PendingMessage | null,
  message: PendingMessage,
) {
  return (
    pending !== null &&
    pending.clientMessageId === message.clientMessageId &&
    hasSameScope(pending, message)
  )
}

function messageError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Không thể gửi tin nhắn. Vui lòng thử lại.'
}

function MessageBubble({
  message,
  own,
}: {
  message: Pick<ChatMessage, 'content' | 'createdAt' | 'senderName'>
  own: boolean
}) {
  return (
    <div className={cn('flex', own ? 'justify-end' : 'justify-start')}>
      <article
        className={cn(
          'max-w-[min(82%,38rem)] rounded-card px-4 py-3 text-sm leading-6 shadow-elevation-1',
          own
            ? 'bg-brand text-white'
            : 'bg-surface-muted text-ink',
        )}
      >
        <p className={cn('text-xs font-bold', own ? 'text-white/80' : 'text-muted')}>
          {own ? 'Bạn' : (message.senderName ?? 'Nhân viên')}
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'mt-2 text-right text-xs font-medium',
            own ? 'text-white/75' : 'text-muted',
          )}
        >
          {own ? `Đã gửi · ${formatDateTime(message.createdAt)}` : formatDateTime(message.createdAt)}
        </p>
      </article>
    </div>
  )
}

export function ChatPanel({
  bookingHref,
  bookingId,
  className,
  embedded = false,
  floating = false,
  onBack,
  onBookingLink,
  onClose,
  onMinimize,
}: ChatPanelProps) {
  const { principal } = useAuth()
  const sessionKey = readAuthSession()?.accessToken ?? null
  const actorKey = principal ? `${principal.actorType}:${principal.id}` : null
  const currentScope = { actorKey, bookingId, sessionKey }
  const contextQuery = useChatBookingContext(bookingId)
  const messagesQuery = useChatMessages(bookingId, { limit: 50 })
  const loadOlderMutation = useLoadOlderChatMessages()
  const sendMutation = useSendChatMessage()
  const readMutation = useMarkChatRead()
  const [draft, setDraft] = useState('')
  const [pendingMessage, setPendingMessage] = useState<PendingMessage | null>(
    null,
  )
  const historyRef = useRef<HTMLElement>(null)
  const initializedBookingRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)
  const pendingMessageRef = useRef<PendingMessage | null>(null)
  const scopeRef = useRef<ChatScope>(currentScope)
  scopeRef.current = currentScope
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [lastDisplayedSequence, setLastDisplayedSequence] = useState<
    number | undefined
  >()
  const messages = messagesQuery.data?.messages ?? []
  const firstVisibleSequence = messages.at(0)?.sequence
  const visibleLastSequence = messages.at(-1)?.sequence
  const booking = contextQuery.data?.booking
  const ownActor = principal
    ? { actorId: principal.id, actorType: principal.actorType }
    : null
  const activePendingMessage =
    pendingMessage && hasSameScope(pendingMessage, currentScope)
      ? pendingMessage
      : null

  const isCurrentMessageScope = (message: PendingMessage) =>
    isMountedRef.current && hasSameScope(scopeRef.current, message)

  const setCurrentPendingMessage = (message: PendingMessage | null) => {
    pendingMessageRef.current = message
    setPendingMessage(message)
  }

  const canSubmit =
    draft.trim().length > 0 &&
    !sendMutation.isPending &&
    activePendingMessage?.state !== 'error'

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (
      !bookingId ||
      !lastDisplayedSequence ||
      contextQuery.data?.unreadCount === 0 ||
      readMutation.isPending
    ) {
      return
    }

    readMutation.mutate({ bookingId, lastReadSequence: lastDisplayedSequence })
  }, [
    bookingId,
    contextQuery.data?.unreadCount,
    lastDisplayedSequence,
    readMutation,
  ])

  useEffect(() => {
    initializedBookingRef.current = null
    setDraft('')
    setCurrentPendingMessage(null)
    setIsAtBottom(true)
    setLastDisplayedSequence(undefined)
  }, [actorKey, bookingId, sessionKey])

  useEffect(() => {
    const history = historyRef.current

    if (!history || !visibleLastSequence) {
      return
    }

    if (initializedBookingRef.current !== bookingId || isAtBottom) {
      history.scrollTop = history.scrollHeight
      initializedBookingRef.current = bookingId
      setIsAtBottom(true)
      setLastDisplayedSequence(visibleLastSequence)
    }
  }, [bookingId, isAtBottom, visibleLastSequence])

  const updateReadPosition = () => {
    const history = historyRef.current

    if (!history) {
      return
    }

    const atBottom =
      history.scrollHeight - history.scrollTop - history.clientHeight <= 24
    setIsAtBottom(atBottom)

    if (atBottom && visibleLastSequence) {
      setLastDisplayedSequence(visibleLastSequence)
    }
  }

  const composedMessage = useMemo(
    () => ({
      clientMessageId:
        activePendingMessage?.clientMessageId ?? createClientMessageId(),
      content: draft.trim(),
    }),
    [activePendingMessage?.clientMessageId, draft],
  )

  if (!appConfig.chatEnabled) {
    return null
  }

  const send = (message: PendingMessage) => {
    setCurrentPendingMessage(message)
    sendMutation.mutate(
      {
        bookingId: message.bookingId,
        input: {
          clientMessageId: message.clientMessageId,
          content: message.content,
        },
      },
      {
        onError: () => {
          if (
            !isCurrentMessageScope(message) ||
            !isSamePendingMessage(pendingMessageRef.current, message)
          ) {
            return
          }

          setCurrentPendingMessage({ ...message, state: 'error' })
        },
        onSuccess: () => {
          if (
            !isCurrentMessageScope(message) ||
            !isSamePendingMessage(pendingMessageRef.current, message)
          ) {
            return
          }

          setDraft('')
          setCurrentPendingMessage(null)
        },
      },
    )
  }

  const submit = () => {
    if (!canSubmit || composedMessage.content.length === 0) {
      return
    }

    send({
      ...composedMessage,
      ...currentScope,
      state: 'sending',
    })
  }

  const retryPendingMessage = () => {
    if (!activePendingMessage || activePendingMessage.state !== 'error') {
      return
    }

    send({ ...activePendingMessage, state: 'sending' })
  }

  const invertedHeader = floating && !embedded
  const panelContent = (
    <>
      <header
        className={cn(
          'flex min-h-14 items-center gap-3 border-b px-3 py-2.5 sm:px-4',
          invertedHeader
            ? 'border-brand-strong/35 bg-brand text-white'
            : embedded
              ? 'border-line bg-surface'
              : 'border-line bg-surface sm:px-5',
        )}
      >
        {onBack ? (
          <Button
            className={cn(
              'shrink-0 px-3',
              embedded
                ? 'sm:hidden'
                : invertedHeader
                ? 'border-white/30 bg-white/10 text-white hover:border-white/45 hover:bg-white/18 focus-visible:outline-white'
                : 'lg:hidden',
            )}
            onClick={onBack}
            variant="outline"
          >
            {embedded ? 'Danh sách' : floating ? 'Hộp thư' : 'Danh sách'}
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              'truncate text-base font-bold',
              invertedHeader ? 'text-white' : 'text-ink',
            )}
          >
            {booking?.bookingCode ?? 'Trao đổi về booking'}
          </h2>
          {booking ? (
            <p
              className={cn(
                'mt-0.5 truncate text-sm',
                invertedHeader ? 'text-white/75' : 'text-muted',
              )}
            >
              Phòng {booking.roomNumber} · {formatDateOnly(booking.checkInDate)}–
              {formatDateOnly(booking.checkOutDate)}
            </p>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1">
          {!floating && bookingHref ? (
            <Link
              className="shrink-0 text-sm font-semibold text-brand-strong underline-offset-4 hover:underline"
              to={bookingHref}
            >
              Mở booking
            </Link>
          ) : null}
          {onMinimize ? (
            <IconButton
              aria-label="Thu gọn cửa sổ chat"
              className={
                invertedHeader
                  ? 'text-white hover:bg-white/14 hover:text-white focus-visible:outline-white'
                  : undefined
              }
              onClick={onMinimize}
              size="sm"
            >
              <Minus aria-hidden="true" className="size-4" />
            </IconButton>
          ) : null}
          {onClose ? (
            <IconButton
              aria-label="Đóng cửa sổ chat"
              className={
                invertedHeader
                  ? 'text-white hover:bg-white/14 hover:text-white focus-visible:outline-white'
                  : undefined
              }
              onClick={onClose}
              size="sm"
            >
              <X aria-hidden="true" className="size-4" />
            </IconButton>
          ) : null}
        </div>
      </header>

      {booking ? (
        <BookingAttachment
          booking={booking}
          bookingHref={bookingHref}
          embedded={embedded}
          onBookingLink={onBookingLink}
        />
      ) : null}

      <section
        aria-label="Lịch sử trao đổi"
        className={cn(
          'min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5',
          embedded ? 'bg-canvas sm:px-5' : 'bg-canvas/45 sm:px-5',
        )}
        onScroll={updateReadPosition}
        ref={historyRef}
      >
        {messagesQuery.isPending ? <LoadingState label="Đang tải trao đổi…" /> : null}
        {messagesQuery.isError ? (
          <ErrorState
            description="Không thể tải lịch sử trao đổi. Vui lòng thử lại."
            onRetry={() => void messagesQuery.refetch()}
          />
        ) : null}
        {!messagesQuery.isPending && !messagesQuery.isError && messages.length === 0 ? (
          <div className="mx-auto grid max-w-md place-items-center py-20 text-center">
            <p className="text-base font-bold text-ink">Bắt đầu cuộc trao đổi</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Gửi câu hỏi về booking này. Nhân viên sẽ trả lời trong hộp thư hỗ trợ.
            </p>
          </div>
        ) : null}
        {messagesQuery.data?.hasMoreBefore && firstVisibleSequence ? (
          <div className="flex justify-center">
            <Button
              disabled={loadOlderMutation.isPending}
              onClick={() =>
                loadOlderMutation.mutate({
                  beforeSequence: firstVisibleSequence,
                  bookingId,
                })
              }
              variant="outline"
            >
              {loadOlderMutation.isPending
                ? 'Đang tải tin cũ...'
                : 'Tải tin cũ hơn'}
            </Button>
          </div>
        ) : null}
        {loadOlderMutation.isError ? (
          <Alert tone="error">
            Không thể tải tin cũ hơn. Vui lòng thử lại.
          </Alert>
        ) : null}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            own={
              ownActor !== null &&
              message.senderActorType === ownActor.actorType &&
              message.senderActorId === ownActor.actorId
            }
          />
        ))}
        {activePendingMessage ? (
          <div className="flex justify-end">
            <article
              className={cn(
                'max-w-[min(82%,38rem)] rounded-card px-4 py-3 text-sm leading-6 shadow-elevation-1',
                activePendingMessage.state === 'error'
                  ? 'bg-danger-soft text-danger-strong'
                  : 'bg-brand text-white',
              )}
            >
              <p className="whitespace-pre-wrap break-words">
                {activePendingMessage.content}
              </p>
              <p className="mt-2 text-right text-xs font-semibold">
                {activePendingMessage.state === 'sending'
                  ? 'Đang gửi…'
                  : 'Gửi lỗi'}
              </p>
              {activePendingMessage.state === 'error' ? (
                <Button
                  className="mt-2 min-h-9 px-3 py-1.5"
                  onClick={retryPendingMessage}
                  variant="outline"
                >
                  Gửi lại
                </Button>
              ) : null}
            </article>
          </div>
        ) : null}
      </section>

      <form
        className="border-t border-line bg-surface px-4 py-3 sm:px-5"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        {sendMutation.isError && activePendingMessage?.state === 'sending' ? (
          <Alert className="mb-3" tone="error">
            {messageError(sendMutation.error)}
          </Alert>
        ) : null}
        <label className="sr-only" htmlFor={`chat-message-${bookingId}`}>
          Nội dung tin nhắn
        </label>
        <Textarea
          disabled={sendMutation.isPending || activePendingMessage?.state === 'error'}
          id={`chat-message-${bookingId}`}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Nhập nội dung cần trao đổi…"
          rows={3}
          value={draft}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">Ctrl/⌘ + Enter để gửi</p>
          <Button disabled={!canSubmit} loading={sendMutation.isPending} type="submit">
            <SendHorizontal aria-hidden="true" className="size-4" />
            Gửi tin nhắn
          </Button>
        </div>
      </form>
    </>
  )

  if (floating) {
    return (
      <section
        className={cn('flex h-full min-h-0 flex-col bg-surface', className)}
      >
        {panelContent}
      </section>
    )
  }

  return (
    <Card className={cn('flex min-h-[34rem] flex-col p-0', className)}>
      {panelContent}
    </Card>
  )
}
