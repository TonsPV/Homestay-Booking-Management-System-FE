import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useAmenityOptions } from '@/features/amenities/hooks'
import { useRoomTypeOptions } from '@/features/room-types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Field, Input, Select } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'

import { RoomCard } from '../components/RoomCard'
import { useRoomSearch } from '../hooks'
import {
  roomSearchFormSchema,
  type RoomSearchFormValues,
} from '../schemas'
import type { SearchRoomsQuery } from '../types'

interface RoomSearchPageProps {
  onViewRoom?: (roomId: string, search: SearchRoomsQuery) => void
}

function getInitialFormValues(searchParams: URLSearchParams): RoomSearchFormValues {
  return {
    amenityIds: searchParams
      .getAll('amenityIds')
      .filter((id) => /^[1-9][0-9]*$/.test(id)),
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    guests: searchParams.get('guests') ?? '1',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    roomTypeId: searchParams.get('roomTypeId') ?? '',
  }
}

function toCriteria(
  values: RoomSearchFormValues,
): SearchRoomsQuery | undefined {
  const guests = Number(values.guests)

  if (
    !values.checkIn ||
    !values.checkOut ||
    values.checkIn >= values.checkOut ||
    !Number.isInteger(guests) ||
    guests < 1
  ) {
    return undefined
  }

  return {
    amenityIds: values.amenityIds,
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests,
    maxPrice: values.maxPrice || undefined,
    minPrice: values.minPrice || undefined,
    page: 1,
    roomTypeId: values.roomTypeId || undefined,
  }
}

function buildSearchParams(values: RoomSearchFormValues) {
  const params = new URLSearchParams({
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests: values.guests,
  })

  if (values.roomTypeId) {
    params.set('roomTypeId', values.roomTypeId)
  }

  if (values.minPrice) {
    params.set('minPrice', values.minPrice)
  }

  if (values.maxPrice) {
    params.set('maxPrice', values.maxPrice)
  }

  for (const amenityId of values.amenityIds) {
    params.append('amenityIds', amenityId)
  }

  return params
}

export function RoomSearchPage({ onViewRoom }: RoomSearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [initialFormValues] = useState(() =>
    getInitialFormValues(searchParams),
  )
  const [criteria, setCriteria] = useState<SearchRoomsQuery | undefined>(() =>
    toCriteria(initialFormValues),
  )
  const roomTypesQuery = useRoomTypeOptions()
  const amenitiesQuery = useAmenityOptions()
  const searchQuery = useRoomSearch(criteria)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RoomSearchFormValues>({
    defaultValues: initialFormValues,
    resolver: zodResolver(roomSearchFormSchema),
  })

  function changePage(page: number) {
    setCriteria((current) =>
      current ? { ...current, page } : current,
    )
  }

  return (
    <div className="grid min-w-0 gap-7">
      <div className="animate-soft-rise">
        <PageHeader
          description="Chọn thời gian lưu trú, số khách và ngân sách để tìm những phòng đang sẵn sàng."
          eyebrow="Đặt phòng"
          title="Tìm phòng trống"
        />
      </div>

      {roomTypesQuery.isError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Không thể tải bộ lọc loại phòng:{' '}
              {getErrorMessage(roomTypesQuery.error)}
            </span>
            <Button
              loading={roomTypesQuery.isFetching}
              onClick={() => void roomTypesQuery.refetch()}
              variant="outline"
            >
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : null}

      {amenitiesQuery.isError ? (
        <Alert tone="error">
          Không thể tải bộ lọc tiện nghi: {getErrorMessage(amenitiesQuery.error)}
        </Alert>
      ) : null}

      <Card className="animate-soft-scale overflow-hidden border-line p-0 shadow-elevation-4">
        <div className="border-b border-line bg-surface px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-control bg-brand text-lg font-black text-white"
            >
              HG
            </div>
            <div>
              <h2 className="text-xl font-black text-ink">
                Đặt phòng khách sạn trực tuyến
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Nhập thông tin kỳ nghỉ để hệ thống kiểm tra phòng còn trống.
              </p>
            </div>
          </div>
        </div>
        <form
          className="grid gap-5 p-5 sm:p-7"
          onSubmit={handleSubmit((values) => {
            setCriteria(toCriteria(values))
            setSearchParams(buildSearchParams(values))
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_1fr]">
            <Field
              error={errors.checkIn?.message}
              label="Ngày nhận phòng"
              required
            >
              <Input type="date" {...register('checkIn')} />
            </Field>
            <Field
              error={errors.checkOut?.message}
              label="Ngày trả phòng"
              required
            >
              <Input type="date" {...register('checkOut')} />
            </Field>
            <Field
              error={errors.guests?.message}
              label="Số khách"
              required
            >
              <Input
                inputMode="numeric"
                min={1}
                step={1}
                type="number"
                {...register('guests')}
              />
            </Field>
            <Field
              error={errors.roomTypeId?.message}
              label="Loại phòng"
            >
              <Select
                disabled={
                  roomTypesQuery.isPending || roomTypesQuery.isError
                }
                {...register('roomTypeId')}
              >
                <option value="">Tất cả loại phòng</option>
                {roomTypesQuery.data?.map((roomType) => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Field
              error={errors.minPrice?.message}
              label="Giá tối thiểu / đêm"
            >
              <Input
                inputMode="decimal"
                min={0}
                placeholder="0"
                step="0.01"
                type="number"
                {...register('minPrice')}
              />
            </Field>
            <Field
              error={errors.maxPrice?.message}
              label="Giá tối đa / đêm"
            >
              <Input
                inputMode="decimal"
                min={0}
                placeholder="3000000"
                step="0.01"
                type="number"
                {...register('maxPrice')}
              />
            </Field>
            <Button
              className="min-h-12 w-full px-8 lg:w-auto"
              loading={searchQuery.isFetching}
              type="submit"
            >
              Tìm kiếm
            </Button>
          </div>

          {amenitiesQuery.data && amenitiesQuery.data.length > 0 ? (
            <fieldset className="grid gap-3 border-t border-line pt-5">
              <legend className="text-sm font-bold text-ink">
                Tiện nghi cần có
              </legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {amenitiesQuery.data.map((amenity) => (
                  <label
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-brand/50 hover:bg-brand-soft"
                    key={amenity.id}
                  >
                    <input
                      className="size-4 shrink-0 accent-blue-600"
                      type="checkbox"
                      value={amenity.id}
                      {...register('amenityIds')}
                    />
                    <span>{amenity.name}</span>
                  </label>
                ))}
              </div>
              {errors.amenityIds?.message ? (
                <p className="text-sm text-danger" role="alert">
                  {errors.amenityIds.message}
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </form>
      </Card>

      {criteria === undefined ? (
        <EmptyState
          description="Chọn ngày nhận phòng, ngày trả phòng và số khách để bắt đầu."
          title="Nhập thông tin kỳ nghỉ"
        />
      ) : searchQuery.isPending ? (
        <LoadingState label="Đang kiểm tra phòng trống…" />
      ) : searchQuery.isError ? (
        <ErrorState
          description={getErrorMessage(searchQuery.error)}
          onRetry={() => void searchQuery.refetch()}
        />
      ) : searchQuery.data.items.length === 0 ? (
        <EmptyState
          description="Không còn phòng đáp ứng các điều kiện đã chọn. Hãy thử ngày hoặc ngân sách khác."
          title="Chưa tìm thấy phòng trống"
        />
      ) : (
        <>
          <div
            aria-live="polite"
            className="flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <h2 className="text-xl font-black text-ink">
                Phòng phù hợp
              </h2>
              <p className="mt-1 text-sm text-muted">
                Kết quả được sắp xếp theo giá từ thấp đến cao.
              </p>
            </div>
            <p className="rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand">
              {searchQuery.data.pagination?.total ??
                searchQuery.data.items.length}{' '}
              kết quả
            </p>
          </div>
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {searchQuery.data.items.map((room) => (
              <RoomCard
                key={room.id}
                onView={
                  onViewRoom
                    ? (roomId) => onViewRoom(roomId, criteria)
                    : undefined
                }
                room={room}
              />
            ))}
          </div>
          <PaginationControls
            onPageChange={changePage}
            pagination={searchQuery.data.pagination}
          />
        </>
      )}
    </div>
  )
}
