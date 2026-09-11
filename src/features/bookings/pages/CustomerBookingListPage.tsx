import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Select } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { LinkButton } from '@/shared/components/LinkButton'

import { BookingCard } from '../components/BookingCard'
import { getBookingStatusLabel } from '../components/bookingStatusLabels'
import { getCustomerBookingActionError } from '../errors'
import { useCustomerBookings } from '../hooks'
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '../types'

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | null): BookingStatus | undefined {
  return BOOKING_STATUSES.find((status) => status === value)
}

export function CustomerBookingListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const status = parseStatus(searchParams.get('status'))
  const query = useMemo(
    () => ({ limit: 10, page, status }),
    [page, status],
  )
  const bookingsQuery = useCustomerBookings(query)

  const updateFilters = (next: { page?: number; status?: string }) => {
    const params = new URLSearchParams(searchParams)

    if (next.status !== undefined) {
      if (next.status) {
        params.set('status', next.status)
      } else {
        params.delete('status')
      }
      params.delete('page')
    }

    if (next.page !== undefined) {
      if (next.page > 1) {
        params.set('page', String(next.page))
      } else {
        params.delete('page')
      }
    }

    setSearchParams(params)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Tài khoản"
        title="Đặt phòng của tôi"
        description="Theo dõi lịch lưu trú, hạn thanh toán và trạng thái từng đặt phòng."
        actions={
          <LinkButton to="/rooms">
            Tìm phòng
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <label className="text-sm font-semibold text-ink" htmlFor="booking-status">
          Lọc theo trạng thái
        </label>
        <Select
          id="booking-status"
          value={status ?? ''}
          onChange={(event) => updateFilters({ status: event.target.value })}
        >
          <option value="">Tất cả trạng thái</option>
          {BOOKING_STATUSES.map((item) => (
            <option key={item} value={item}>
              {getBookingStatusLabel(item)}
            </option>
          ))}
        </Select>
      </div>

      {bookingsQuery.isPending ? (
        <LoadingState label="Đang tải danh sách đặt phòng…" />
      ) : bookingsQuery.isError ? (
        <ErrorState
          description={getCustomerBookingActionError(bookingsQuery.error)}
          onRetry={() => void bookingsQuery.refetch()}
        />
      ) : bookingsQuery.data.data.length === 0 ? (
        <EmptyState
          title="Chưa có đặt phòng"
          description={
            status
              ? 'Không có đặt phòng nào phù hợp với trạng thái đã chọn.'
              : 'Hãy tìm một phòng phù hợp để bắt đầu chuyến đi của bạn.'
          }
          action={
            status ? (
              <Button
                variant="outline"
                onClick={() => updateFilters({ status: '' })}
              >
                Xóa bộ lọc
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {bookingsQuery.data.data.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                to={booking.id}
              />
            ))}
          </div>
          <PaginationControls
            pagination={bookingsQuery.data.meta?.pagination}
            onPageChange={(nextPage) => updateFilters({ page: nextPage })}
          />
        </>
      )}
    </div>
  )
}
