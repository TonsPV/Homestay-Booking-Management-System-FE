import { useEffect, useMemo } from 'react'

import { useAvailableRooms } from '@/features/rooms/hooks'
import type { Room } from '@/features/rooms/types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { cn } from '@/shared/components/cn'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { formatMoney } from '@/shared/formatting/formatters'

import {
  type CounterRoomAvailabilityState,
  isAvailabilityCriteriaValid,
  nightsBetween,
} from './counterRoomAvailability'

interface CounterRoomPickerProps {
  checkIn?: string
  checkOut?: string
  guests?: number
  onAvailabilityStateChange?: (state: CounterRoomAvailabilityState) => void
  onSelect: (room: Room) => void
  page: number
  onPageChange: (page: number) => void
  selectedRoomId?: string
}

export function CounterRoomPicker({
  checkIn,
  checkOut,
  guests,
  onAvailabilityStateChange,
  onPageChange,
  onSelect,
  page,
  selectedRoomId,
}: CounterRoomPickerProps) {
  const ready = isAvailabilityCriteriaValid(checkIn, checkOut, guests)
  const query = useMemo(
    () =>
      ready
        ? {
            checkIn: checkIn as string,
            checkOut: checkOut as string,
            guests,
            limit: 12,
            page,
          }
        : undefined,
    [checkIn, checkOut, guests, page, ready],
  )
  const { data, error, isError, isFetching, isPending, isSuccess, refetch } =
    useAvailableRooms(query)
  const nights = nightsBetween(checkIn, checkOut)

  useEffect(() => {
    onAvailabilityStateChange?.({ isFetching, isSuccess })
  }, [isFetching, isSuccess, onAvailabilityStateChange])

  if (!ready) {
    return (
      <Card className="border-dashed bg-surface-muted/60 py-10 text-center">
        <p className="text-sm font-semibold text-ink">
          Nhập ngày nhận, ngày trả và số khách để tìm phòng trống
        </p>
        <p className="mt-2 text-sm text-muted">
          Ngày trả phải sau ngày nhận và số khách tối thiểu là 1. Danh sách
          phòng khả dụng sẽ hiển thị tại đây khi tiêu chí hợp lệ.
        </p>
      </Card>
    )
  }

  if (isPending) {
    return <LoadingState label="Đang tìm phòng trống…" />
  }

  if (isError) {
    return (
      <ErrorState
        description={
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách phòng trống.'
        }
        onRetry={() => void refetch()}
      />
    )
  }

  const rooms = data?.items ?? []

  if (rooms.length === 0) {
    return (
      <EmptyState
        description="Không có phòng nào trống trong khoảng ngày này. Hãy thử đổi ngày hoặc giảm số khách."
        title="Hết phòng trống"
      />
    )
  }

  return (
    <div className="grid gap-4">
      <div
        aria-label="Danh sách phòng trống"
        className="grid gap-3"
        role="radiogroup"
      >
        {rooms.map((room) => {
          const selected = room.id === selectedRoomId
          const cover = room.images.find((image) => image.isCover)
          const image = cover ?? room.images[0]
          const total = nights * Number(room.roomType.basePrice)

          return (
            <button
              aria-checked={selected}
              className={cn(
                'grid w-full grid-cols-[auto_1fr] items-center gap-4 rounded-panel border p-4 text-left transition duration-fast ease-calm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none',
                selected
                  ? 'border-brand bg-brand-soft shadow-card'
                  : 'border-line bg-surface hover:border-muted/60 hover:bg-surface-muted',
              )}
              key={room.id}
              onClick={() => onSelect(room)}
              role="radio"
              type="button"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-5 place-items-center rounded-full border-2',
                  selected
                    ? 'border-brand bg-brand'
                    : 'border-muted/50 bg-surface',
                )}
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                {image ? (
                  <img
                    alt=""
                    className="h-16 w-24 rounded-card object-cover"
                    src={image.imageUrl}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="grid h-16 w-24 place-items-center rounded-card bg-surface-muted text-xs font-semibold text-muted"
                  >
                    Không ảnh
                  </span>
                )}
                <span className="grid gap-1">
                  <span className="text-sm font-bold text-ink">
                    Phòng {room.roomNumber} · {room.name}
                  </span>
                  <span className="text-xs text-muted">
                    {room.roomType.name} · Tối đa {room.roomType.maxGuests}{' '}
                    khách
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {formatMoney(room.roomType.basePrice)} / đêm
                  </span>
                </span>
                <span className="grid gap-0.5 sm:text-right">
                  <span className="text-xs text-muted">
                    {nights} đêm · Tạm tính
                  </span>
                  <span className="text-base font-bold text-ink">
                    {formatMoney(String(total))}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
      <PaginationControls
        onPageChange={onPageChange}
        pagination={data?.pagination}
      />
      <div className="flex justify-end">
        <Button onClick={() => void refetch()} variant="outline">
          Làm mới danh sách
        </Button>
      </div>
    </div>
  )
}
