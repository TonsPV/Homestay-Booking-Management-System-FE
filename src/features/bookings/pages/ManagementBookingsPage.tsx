import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useMemo,
} from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useSearchParams } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import {
  Field,
  Input,
  Select,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'

import { ManagementBookingList } from '../components/ManagementBookingList'
import { getBookingStatusLabel } from '../components/bookingStatusLabels'
import { BookingStatsSummary } from '../components/BookingStatsSummary'
import { getBookingActionError } from '../errors'
import { useManagementBookings } from '../hooks'
import {
  managementBookingFilterSchema,
  type ManagementBookingFilterValues,
} from '../schemas'
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

export function ManagementBookingsPage() {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const status = parseStatus(searchParams.get('status'))
  const search = searchParams.get('search') ?? ''
  const customerId = searchParams.get('customerId') ?? ''
  const roomId = searchParams.get('roomId') ?? ''
  const query = useMemo(
    () => ({
      customerId: customerId || undefined,
      limit: 10,
      page,
      roomId: roomId || undefined,
      search: search || undefined,
      status,
    }),
    [customerId, page, roomId, search, status],
  )
  const bookingsQuery = useManagementBookings(query)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ManagementBookingFilterValues>({
    defaultValues: {
      customerId,
      roomId,
      search,
      status: status ?? '',
    },
    resolver: zodResolver(managementBookingFilterSchema),
  })

  useEffect(() => {
    reset({
      customerId,
      roomId,
      search,
      status: status ?? '',
    })
  }, [customerId, reset, roomId, search, status])

  const submitFilters = handleSubmit((values) => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value)
      }
    }

    setSearchParams(params)
  })

  const resetFilters = () => {
    reset({
      customerId: '',
      roomId: '',
      search: '',
      status: '',
    })
    setSearchParams(new URLSearchParams())
  }

  const pageBookings = bookingsQuery.data?.data ?? []

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý"
        title="Danh sách đặt phòng"
        description="Tìm theo mã booking, người liên hệ, số điện thoại hoặc lọc theo đối tượng liên quan."
      />

      <BookingStatsSummary
        bookings={pageBookings}
        loading={bookingsQuery.isPending}
        paymentsPath={
          pathname.startsWith('/staff/')
            ? '/staff/payments'
            : '/management/payments'
        }
      />

      <form
        className="grid gap-4 rounded-panel border border-line bg-surface p-4 shadow-card lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        onSubmit={submitFilters}
      >
        <Field label="Tìm kiếm" error={errors.search?.message}>
          <Input
            {...register('search')}
            placeholder="Mã booking, tên hoặc số điện thoại"
          />
        </Field>
        <Field label="Trạng thái" error={errors.status?.message}>
          <Select {...register('status')}>
            <option value="">Tất cả</option>
            {BOOKING_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getBookingStatusLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mã khách hàng" error={errors.customerId?.message}>
          <Input {...register('customerId')} inputMode="numeric" />
        </Field>
        <Field label="Mã phòng" error={errors.roomId?.message}>
          <Input {...register('roomId')} inputMode="numeric" />
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit">Lọc</Button>
          <Button onClick={resetFilters} variant="outline">
            Xóa
          </Button>
        </div>
      </form>

      {bookingsQuery.isPending ? (
        <LoadingState label="Đang tải danh sách booking…" />
      ) : bookingsQuery.isError ? (
        <ErrorState
          description={getBookingActionError(bookingsQuery.error)}
          onRetry={() => void bookingsQuery.refetch()}
        />
      ) : bookingsQuery.data.data.length === 0 ? (
        <EmptyState
          title="Không có booking phù hợp"
          description="Hãy điều chỉnh bộ lọc rồi thử lại."
          action={
            <Button onClick={resetFilters} variant="outline">
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <>
          <ManagementBookingList bookings={bookingsQuery.data.data} />
          <PaginationControls
            pagination={bookingsQuery.data.meta?.pagination}
            onPageChange={(nextPage) => {
              const params = new URLSearchParams(searchParams)
              if (nextPage > 1) {
                params.set('page', String(nextPage))
              } else {
                params.delete('page')
              }
              setSearchParams(params)
            }}
          />
        </>
      )}
    </div>
  )
}
