import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from '@/auth/useAuth'

import {
  CustomerChatWidgetContext,
  type CustomerChatWidgetContextValue,
} from './customer-chat-widget-context'

export function CustomerChatWidgetProvider({
  children,
}: {
  children: ReactNode
}) {
  const { principal } = useAuth()
  const actorKey =
    principal?.actorType === 'customer'
      ? `${principal.actorType}:${principal.id}`
      : null
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    setIsOpen(false)
    setIsMinimized(false)
    setSelectedBookingId(null)
  }, [actorKey])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
    setSelectedBookingId(null)
  }, [])

  const minimize = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(true)
  }, [])

  const openInbox = useCallback(() => {
    if (actorKey === null) {
      return
    }

    setIsOpen(true)
    setIsMinimized(false)
    setSelectedBookingId(null)
  }, [actorKey])

  const openBooking = useCallback(
    (bookingId: string) => {
      if (actorKey === null || bookingId.trim().length === 0) {
        return
      }

      setIsOpen(true)
      setIsMinimized(false)
      setSelectedBookingId(bookingId)
    },
    [actorKey],
  )

  const value = useMemo<CustomerChatWidgetContextValue>(
    () => ({
      close,
      isMinimized,
      isOpen,
      minimize,
      openBooking,
      openInbox,
      selectedBookingId,
    }),
    [
      close,
      isMinimized,
      isOpen,
      minimize,
      openBooking,
      openInbox,
      selectedBookingId,
    ],
  )

  return (
    <CustomerChatWidgetContext.Provider value={value}>
      {children}
    </CustomerChatWidgetContext.Provider>
  )
}
