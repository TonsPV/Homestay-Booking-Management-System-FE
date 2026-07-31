import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { RoomType } from '@/features/room-types'
import { Button } from '@/shared/components/Button'
import {
  Field,
  Input,
  Select,
  Textarea,
} from '@/shared/components/FormControls'
import { formatMoney } from '@/shared/formatting/formatters'

import {
  roomFormSchema,
  type RoomFormValues,
} from '../schemas'
import { getRoomStatusLabel } from '../status'
import type {
  CreateRoomInput,
  Room,
  UpdateRoomInput,
} from '../types'
import { ROOM_STATUSES } from '../types'

interface RoomFormProps {
  initialValue?: Room
  loading?: boolean
  onCancel: () => void
  onSubmit: (
    input: CreateRoomInput | UpdateRoomInput,
  ) => Promise<void> | void
  roomTypes: RoomType[]
}

export function RoomForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
  roomTypes,
}: RoomFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RoomFormValues>({
    defaultValues: {
      description: initialValue?.description ?? '',
      name: initialValue?.name ?? '',
      roomNumber: initialValue?.roomNumber ?? '',
      roomTypeId: initialValue?.roomTypeId ?? '',
      status: initialValue?.status ?? 'READY',
    },
    resolver: zodResolver(roomFormSchema),
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        const commonInput = {
          description: values.description || null,
          name: values.name,
          roomNumber: values.roomNumber,
          roomTypeId: values.roomTypeId,
        }

        await onSubmit(
          initialValue
            ? commonInput
            : { ...commonInput, status: values.status },
        )
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={errors.roomNumber?.message}
          label="Số phòng"
          required
        >
          <Input
            autoComplete="off"
            maxLength={50}
            placeholder="Ví dụ: A101"
            {...register('roomNumber')}
          />
        </Field>
        <Field error={errors.name?.message} label="Tên phòng" required>
          <Input
            autoComplete="off"
            maxLength={120}
            placeholder="Ví dụ: Phòng hướng vườn"
            {...register('name')}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={errors.roomTypeId?.message}
          label="Loại phòng"
          required
        >
          <Select {...register('roomTypeId')}>
            <option value="">Chọn loại phòng</option>
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name} · {formatMoney(roomType.basePrice)}
              </option>
            ))}
          </Select>
        </Field>
        {!initialValue ? (
          <Field error={errors.status?.message} label="Trạng thái ban đầu">
            <Select {...register('status')}>
              {ROOM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getRoomStatusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
            Trạng thái vận hành được cập nhật bằng thao tác riêng để hạn chế
            thay đổi nhầm.
          </div>
        )}
      </div>

      <Field error={errors.description?.message} label="Mô tả">
        <Textarea
          maxLength={10_000}
          placeholder="Mô tả vị trí, không gian và tiện nghi của phòng"
          {...register('description')}
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-3">
        <Button disabled={loading} onClick={onCancel} variant="outline">
          Hủy
        </Button>
        <Button loading={loading} type="submit">
          {initialValue ? 'Lưu thay đổi' : 'Tạo phòng'}
        </Button>
      </div>
    </form>
  )
}
