import { useState, type FormEvent } from 'react'

import { getErrorMessage } from '@/api/errors'
import { useRoomTypeOptions } from '@/features/room-types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Input, Select } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'

import { RoomCard } from '../components/RoomCard'
import { useRooms } from '../hooks'

interface PublicRoomsPageProps {
  initialRoomTypeId?: string
  onOpenSearch?: () => void
  onViewRoom?: (roomId: string) => void
}

export function PublicRoomsPage({
  initialRoomTypeId = '',
  onOpenSearch,
  onViewRoom,
}: PublicRoomsPageProps) {
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [roomTypeDraft, setRoomTypeDraft] = useState(initialRoomTypeId)
  const [filters, setFilters] = useState({
    roomTypeId: initialRoomTypeId,
    search: '',
  })
  const roomTypesQuery = useRoomTypeOptions()
  const roomsQuery = useRooms({
    page,
    roomTypeId: filters.roomTypeId || undefined,
    search: filters.search || undefined,
  })

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({
      roomTypeId: roomTypeDraft,
      search: searchDraft.trim(),
    })
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setRoomTypeDraft('')
    setFilters({ roomTypeId: '', search: '' })
    setPage(1)
  }

  return (
    <div className="grid min-w-0 gap-7">
      <div className="animate-soft-rise">
        <PageHeader
          actions={
            onOpenSearch ? (
              <Button className="min-h-11 px-6" onClick={onOpenSearch}>
                Tìm phòng trống
              </Button>
            ) : undefined
          }
          description="Khám phá từng không gian, so sánh mức giá và chọn căn phòng phù hợp cho kỳ nghỉ của bạn."
          eyebrow="Homestay Green"
          title="Danh sách phòng"
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

      <Card className="border-line p-5 shadow-elevation-3 sm:p-6">
        <form
          aria-label="Lọc danh sách phòng"
          className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)_auto]"
          onSubmit={applyFilters}
        >
          <label
            className="grid min-w-0 gap-2 text-sm font-semibold text-ink"
            htmlFor="public-room-search"
          >
            Tìm phòng
            <Input
              id="public-room-search"
              maxLength={160}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tên phòng, số phòng hoặc mô tả"
              value={searchDraft}
            />
          </label>
          <label
            className="grid min-w-0 gap-2 text-sm font-semibold text-ink"
            htmlFor="public-room-type"
          >
            Loại phòng
            <Select
              disabled={roomTypesQuery.isPending || roomTypesQuery.isError}
              id="public-room-type"
              onChange={(event) => setRoomTypeDraft(event.target.value)}
              value={roomTypeDraft}
            >
              <option value="">Tất cả loại phòng</option>
              {roomTypesQuery.data?.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row lg:col-span-1 lg:items-end">
            <Button className="min-h-11 flex-1 px-6" type="submit">
              Lọc
            </Button>
            <Button className="min-h-11 flex-1" onClick={resetFilters} variant="text">
              Đặt lại
            </Button>
          </div>
        </form>
      </Card>

      {roomsQuery.isPending ? (
        <LoadingState label="Đang tải danh sách phòng…" />
      ) : roomsQuery.isError ? (
        <ErrorState
          description={getErrorMessage(roomsQuery.error)}
          onRetry={() => void roomsQuery.refetch()}
        />
      ) : roomsQuery.data.items.length === 0 ? (
        <EmptyState
          action={
            filters.roomTypeId || filters.search ? (
              <Button onClick={resetFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            ) : undefined
          }
          description="Hãy thay đổi bộ lọc hoặc quay lại sau để xem phòng mới."
          title="Không tìm thấy phòng phù hợp"
        />
      ) : (
        <>
          <div
            aria-live="polite"
            className="flex flex-wrap items-end justify-between gap-3"
          >
            <div>
              <h2 className="text-xl font-black text-ink">
                Phòng dành cho bạn
              </h2>
              <p className="mt-1 text-sm text-muted">
                {roomsQuery.data.pagination?.total ??
                  roomsQuery.data.items.length}{' '}
                lựa chọn phù hợp
              </p>
            </div>
          </div>
          <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {roomsQuery.data.items.map((room) => (
              <RoomCard key={room.id} onView={onViewRoom} room={room} />
            ))}
          </div>
          <PaginationControls
            onPageChange={setPage}
            pagination={roomsQuery.data.pagination}
          />
        </>
      )}
    </div>
  )
}
