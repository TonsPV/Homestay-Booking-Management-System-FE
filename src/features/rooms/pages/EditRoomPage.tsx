import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useRoomTypeOptions } from '@/features/room-types'
import { Alert, ErrorState, LoadingState } from '@/shared/components/Feedback'
import { PageHeader } from '@/shared/components/PageHeader'

import { RoomForm } from '../components/RoomForm'
import { useManagementRoom, useUpdateRoom } from '../hooks'
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from '../types'

interface EditRoomPageProps {
  roomId: string
}

/**
 * Standalone edit-room flow (RESTful route /management/rooms/:roomId/edit).
 * Replaces the former inline edit mode on ManagementRoomDetailPage. Loads the
 * current room and submits via useUpdateRoom, then returns to the detail page.
 */
export function EditRoomPage({ roomId }: EditRoomPageProps) {
  const navigate = useNavigate()
  const query = useManagementRoom(roomId)
  const roomTypesQuery = useRoomTypeOptions(true)
  const updateMutation = useUpdateRoom()
  const [errorMessage, setErrorMessage] = useState<string>()

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

  async function handleSubmit(input: CreateRoomInput | UpdateRoomInput) {
    const updateInput: UpdateRoomInput = {
      description: input.description,
      name: input.name,
      roomNumber: input.roomNumber,
      roomTypeId: input.roomTypeId,
    }

    setErrorMessage(undefined)

    try {
      await updateMutation.mutateAsync({
        id: room.id,
        input: updateInput,
      })
      navigate(`/management/rooms/${room.id}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Trạng thái vận hành được cập nhật bằng thao tác riêng tại trang chi tiết."
        title={`Chỉnh sửa phòng ${room.roomNumber}`}
      />

      {roomTypesQuery.isError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Không thể tải loại phòng: {getErrorMessage(roomTypesQuery.error)}
            </span>
            <button
              className="font-semibold underline underline-offset-4"
              onClick={() => void roomTypesQuery.refetch()}
              type="button"
            >
              Thử lại
            </button>
          </div>
        </Alert>
      ) : null}

      {updateMutation.isError && !errorMessage ? (
        <Alert tone="error">{getErrorMessage(updateMutation.error)}</Alert>
      ) : null}
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      <RoomForm
        initialValue={room}
        loading={updateMutation.isPending}
        onCancel={() => navigate(`/management/rooms/${room.id}`)}
        onSubmit={handleSubmit}
        roomTypes={roomTypesQuery.data ?? []}
      />
    </div>
  )
}
