import { useState } from 'react'

import { getErrorMessage } from '@/api/errors'
import { useRoomTypeOptions } from '@/features/room-types'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Select } from '@/shared/components/FormControls'
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from '@/shared/formatting/formatters'

import { RoomForm } from '../components/RoomForm'
import { RoomCalendarManager } from '../components/RoomCalendarManager'
import { RoomImage } from '../components/RoomImage'
import { RoomImageManager } from '../components/RoomImageManager'
import { RoomStatusBadge } from '../components/RoomStatusBadge'
import {
  useDeleteRoom,
  useManagementRoom,
  useUpdateRoom,
  useUpdateRoomStatus,
} from '../hooks'
import { resolveRoomImageUrl } from '../image-url'
import { getRoomStatusLabel } from '../status'
import {
  ROOM_STATUSES,
  type CreateRoomInput,
  type ManagementRole,
  type RoomStatus,
  type UpdateRoomInput,
} from '../types'

type DetailMode = 'edit' | 'images' | null

interface ManagementRoomDetailPageProps {
  onBack?: () => void
  onDeleted?: () => void
  role: ManagementRole
  roomId: string
}

function statusOptionsFor(role: ManagementRole) {
  return role === 'ADMIN'
    ? ROOM_STATUSES
    : ROOM_STATUSES.filter((status) => status !== 'HIDDEN')
}

export function ManagementRoomDetailPage({
  onBack,
  onDeleted,
  role,
  roomId,
}: ManagementRoomDetailPageProps) {
  const query = useManagementRoom(roomId)
  const roomTypesQuery = useRoomTypeOptions(role === 'ADMIN')
  const updateMutation = useUpdateRoom()
  const deleteMutation = useDeleteRoom()
  const statusMutation = useUpdateRoomStatus()
  const [mode, setMode] = useState<DetailMode>(null)
  const [statusDraft, setStatusDraft] = useState<RoomStatus>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const actionError =
    updateMutation.error ?? deleteMutation.error ?? statusMutation.error

  if (query.isPending) {
    return <LoadingState label="Đang tải thông tin phòng…" />
  }

  if (query.isError) {
    return (
      <ErrorState
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const room = query.data
  const selectedStatus = statusDraft ?? room.status
  const staffCannotChangeHidden =
    role === 'STAFF' && room.status === 'HIDDEN'

  async function submitUpdate(
    input: CreateRoomInput | UpdateRoomInput,
  ) {
    const updateInput: UpdateRoomInput = {
      description: input.description,
      name: input.name,
      roomNumber: input.roomNumber,
      roomTypeId: input.roomTypeId,
    }

    try {
      setSuccessMessage(undefined)
      await updateMutation.mutateAsync({
        id: room.id,
        input: updateInput,
      })
      setMode(null)
      setSuccessMessage('Đã cập nhật phòng.')
    } catch {
      // Mutation state renders the normalized API error in the form.
    }
  }

  function saveStatus() {
    setSuccessMessage(undefined)
    statusMutation.mutate(
      {
        id: room.id,
        status: selectedStatus,
      },
      {
        onSuccess: () => {
          setStatusDraft(undefined)
          setSuccessMessage('Đã cập nhật trạng thái phòng.')
        },
      },
    )
  }

  function removeRoom() {
    if (
      !window.confirm(
        `Xóa vĩnh viễn phòng ${room.roomNumber}? Phòng có lịch sử đặt sẽ không thể xóa.`,
      )
    ) {
      return
    }

    deleteMutation.mutate(room.id, {
      onSuccess: () => onDeleted?.(),
    })
  }

  if (mode === 'images') {
    return (
      <div className="grid gap-5">
        {onBack ? (
          <div>
            <Button onClick={onBack} variant="text">
              ← Quay lại danh sách phòng
            </Button>
          </div>
        ) : null}
        <RoomImageManager
          onClose={() => setMode(null)}
          roomId={room.id}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {onBack ? (
        <div>
          <Button onClick={onBack} variant="text">
            ← Quay lại danh sách phòng
          </Button>
        </div>
      ) : null}

      {role === 'ADMIN' && roomTypesQuery.isError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Không thể tải loại phòng: {getErrorMessage(roomTypesQuery.error)}
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

      {actionError ? (
        <Alert tone="error">{getErrorMessage(actionError)}</Alert>
      ) : null}
      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {mode === 'edit' ? (
        <Card>
          <div className="mb-5">
            <h1 className="text-xl font-black text-slate-950">
              Chỉnh sửa phòng {room.roomNumber}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Trạng thái vận hành được cập nhật bằng thao tác riêng.
            </p>
          </div>
          <RoomForm
            initialValue={room}
            loading={updateMutation.isPending}
            onCancel={() => setMode(null)}
            onSubmit={submitUpdate}
            roomTypes={roomTypesQuery.data ?? []}
          />
        </Card>
      ) : (
        <>
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{room.roomType.name}</Badge>
                  <RoomStatusBadge status={room.status} />
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {room.roomNumber} · {room.name}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {room.description || 'Chưa có mô tả.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
                {role === 'ADMIN' ? (
                  <>
                    <Button
                      disabled={
                        roomTypesQuery.isPending ||
                        roomTypesQuery.isError ||
                        (roomTypesQuery.data?.length ?? 0) === 0
                      }
                      onClick={() => setMode('edit')}
                      variant="outline"
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      onClick={() => setMode('images')}
                      variant="outline"
                    >
                      Quản lý ảnh
                    </Button>
                    <Button
                      loading={deleteMutation.isPending}
                      onClick={removeRoom}
                      variant="danger"
                    >
                      Xóa phòng
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <dl className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Giá cơ bản
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatMoney(room.roomType.basePrice)} / đêm
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Sức chứa
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatNumber(room.roomType.maxGuests)} khách
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ngày tạo
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatDateTime(room.createdAt)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Cập nhật
                </dt>
                <dd className="mt-1 font-black text-slate-900">
                  {formatDateTime(room.updatedAt)}
                </dd>
              </div>
            </dl>

            <section
              className="mt-7 border-t border-slate-100 pt-6"
              aria-labelledby="room-status-heading"
            >
              <h2
                className="font-black text-slate-950"
                id="room-status-heading"
              >
                Trạng thái vận hành
              </h2>
              {staffCannotChangeHidden ? (
                <p className="mt-2 text-sm text-slate-600">
                  Chỉ quản trị viên có thể mở lại phòng đã ẩn.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Select
                    aria-label={`Trạng thái phòng ${room.roomNumber}`}
                    className="max-w-60"
                    disabled={statusMutation.isPending}
                    onChange={(event) =>
                      setStatusDraft(event.target.value as RoomStatus)
                    }
                    value={selectedStatus}
                  >
                    {statusOptionsFor(role).map((status) => (
                      <option key={status} value={status}>
                        {getRoomStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={selectedStatus === room.status}
                    loading={statusMutation.isPending}
                    onClick={saveStatus}
                  >
                    Lưu trạng thái
                  </Button>
                </div>
              )}
            </section>
          </Card>

          <RoomCalendarManager roomId={room.id} />

          <section aria-labelledby="room-images-heading">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  className="text-xl font-black text-slate-950"
                  id="room-images-heading"
                >
                  Thư viện ảnh
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {formatNumber(room.images.length)} ảnh
                </p>
              </div>
            </div>

            {room.images.length === 0 ? (
              <Card className="mt-4 border-dashed py-10 text-center text-sm text-slate-500">
                Phòng chưa có ảnh.
              </Card>
            ) : (
              <div
                aria-label={`Ảnh phòng ${room.roomNumber}`}
                className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                role="group"
              >
                {room.images.map((image) => (
                  <figure
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    key={image.id}
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <RoomImage
                        alt={`Ảnh phòng ${room.roomNumber}`}
                        className="size-full object-cover"
                        fallbackLabel="Không thể tải ảnh"
                        loading="lazy"
                        src={resolveRoomImageUrl(image.imageUrl)}
                      />
                      {image.isCover ? (
                        <Badge
                          className="absolute left-3 top-3"
                          tone="blue"
                        >
                          Ảnh bìa
                        </Badge>
                      ) : null}
                    </div>
                    <figcaption className="p-3 text-xs text-slate-500">
                      Thứ tự: {image.sortOrder}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
