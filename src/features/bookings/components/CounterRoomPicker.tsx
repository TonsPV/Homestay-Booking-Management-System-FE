import { useEffect, useMemo, useState } from 'react'

import { useAvailableRooms } from '@/features/rooms/hooks'
import { resolveRoomImageUrl } from '@/features/rooms/image-url'
import type { ListAvailableRoomsQuery, Room } from '@/features/rooms/types'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { cn } from '@/shared/components/cn'
import { EmptyState, ErrorState } from '@/shared/components/Feedback'
import { formatMoney } from '@/shared/formatting/formatters'

import { getBookingActionError } from '../errors'
import {
  type CounterRoomAvailabilityState,
  isAvailabilityCriteriaValid,
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

function RoomSkeleton() {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 rounded-panel bg-surface p-3 shadow-elevation-1 motion-safe:animate-pulse">
      <div className="aspect-[4/3] rounded-card bg-surface-muted" />
      <div className="grid content-center gap-3">
        <div className="h-4 w-2/3 rounded bg-surface-muted" />
        <div className="h-3 w-1/2 rounded bg-surface-muted" />
        <div className="h-4 w-1/3 rounded bg-surface-muted" />
      </div>
    </div>
  )
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
  const criteriaKey = `${checkIn ?? ''}|${checkOut ?? ''}|${guests ?? ''}`
  const [loadedRooms, setLoadedRooms] = useState<Room[]>([])
  const query = useMemo<ListAvailableRoomsQuery | undefined>(
    () =>
      ready
        ? {
            checkIn: checkIn as string,
            checkOut: checkOut as string,
            guests: guests as number,
            limit: 12,
            page,
          }
        : undefined,
    [checkIn, checkOut, guests, page, ready],
  )
  const { data, error, isError, isFetching, isPending, isSuccess, refetch } =
    useAvailableRooms(query)

  useEffect(() => {
    if (!ready) {
      setLoadedRooms([])
      return
    }
    if (!isSuccess || !data) return

    setLoadedRooms((current) => {
      if (page === 1) return data.items

      const knownIds = new Set(current.map((room) => room.id))
      return [
        ...current,
        ...data.items.filter((room) => !knownIds.has(room.id)),
      ]
    })
  }, [criteriaKey, data, isSuccess, page, ready])

  useEffect(() => {
    onAvailabilityStateChange?.({ isFetching, isSuccess })
  }, [isFetching, isSuccess, onAvailabilityStateChange])

  if (!ready) {
    return (
      <div className="rounded-panel bg-surface px-6 py-12 text-center shadow-elevation-1">
        <p className="text-sm font-bold text-ink">Bắt đầu bằng kỳ lưu trú</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Chọn ngày nhận, ngày trả và số khách. Phòng phù hợp sẽ xuất hiện ngay
          bên dưới.
        </p>
      </div>
    )
  }

  if (isPending && loadedRooms.length === 0) {
    return (
      <div
        aria-label="Đang tìm phòng trống"
        className="grid gap-3"
        role="status"
      >
        <span className="sr-only">Đang tìm phòng trống…</span>
        <RoomSkeleton />
        <RoomSkeleton />
        <RoomSkeleton />
      </div>
    )
  }

  if (isError && loadedRooms.length === 0) {
    return (
      <ErrorState
        description={getBookingActionError(error)}
        onRetry={() => void refetch()}
      />
    )
  }

  if (loadedRooms.length === 0 && isSuccess) {
    return (
      <EmptyState
        description="Không có phòng phù hợp. Hãy đổi ngày hoặc giảm số khách để tìm lại."
        title="Hết phòng trống"
      />
    )
  }

  const pagination = data?.pagination
  const canLoadMore =
    pagination !== undefined && pagination.page < pagination.totalPages

  return (
    <div className="grid gap-4">
      <div
        aria-label="Danh sách phòng trống"
        className="grid gap-4 2xl:grid-cols-2"
        role="radiogroup"
      >
        {loadedRooms.map((room) => {
          const selected = room.id === selectedRoomId
          const image =
            room.images.find((item) => item.isCover) ?? room.images[0]
          const amenities = room.roomType.amenities.slice(0, 2)

          return (
            <button
              aria-checked={selected}
              className={cn(
                'group grid w-full grid-cols-[8rem_minmax(0,1fr)] gap-4 rounded-panel p-3 text-left transition duration-base ease-calm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none sm:grid-cols-[9rem_minmax(0,1fr)]',
                selected
                  ? 'bg-brand-soft shadow-elevation-3 ring-2 ring-brand'
                  : 'bg-surface shadow-elevation-1 hover:-translate-y-0.5 hover:shadow-elevation-3',
              )}
              key={room.id}
              onClick={() => onSelect(room)}
              role="radio"
              type="button"
            >
              <span className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-muted">
                {image ? (
                  <img
                    alt=""
                    className="size-full object-cover transition duration-base ease-calm group-hover:scale-[1.03] motion-reduce:transition-none"
                    decoding="async"
                    loading="lazy"
                    src={resolveRoomImageUrl(image.imageUrl)}
                  />
                ) : (
                  <span className="grid size-full place-items-center text-xs font-semibold text-muted">
                    Chưa có ảnh
                  </span>
                )}
                <Badge className="absolute left-2 top-2" tone="emerald">
                  Còn trống
                </Badge>
              </span>

              <span className="flex min-w-0 flex-col">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-lg font-black leading-tight text-ink">
                      Phòng {room.roomNumber}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-muted">
                      {room.roomType.name}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold',
                      selected ? 'text-brand-strong' : 'text-muted',
                    )}
                  >
                    {selected ? 'Đã chọn' : 'Chọn phòng'}
                  </span>
                </span>

                <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>Tối đa {room.roomType.maxGuests} khách</span>
                  {amenities.map((amenity) => (
                    <span key={amenity.id}>{amenity.name}</span>
                  ))}
                </span>

                <span className="mt-auto pt-3 text-base font-black text-ink">
                  {formatMoney(room.roomType.basePrice)}
                  <span className="text-xs font-medium text-muted"> / đêm</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button
            loading={isFetching}
            onClick={() => onPageChange(page + 1)}
            variant="outline"
          >
            Xem thêm phòng
          </Button>
        </div>
      ) : null}
    </div>
  )
}
