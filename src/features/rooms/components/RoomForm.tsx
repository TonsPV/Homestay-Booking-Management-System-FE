import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ReactNode } from 'react'

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
  imagePicker?: ReactNode
  initialValue?: Room
  loading?: boolean
  onCancel: () => void
  onSubmit: (
    input: CreateRoomInput | UpdateRoomInput,
  ) => Promise<void> | void
  roomTypes: RoomType[]
  roomFieldsDisabled?: boolean
  submitDisabled?: boolean
  submitLabel?: string
}

export function RoomForm({
  imagePicker,
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
  roomTypes,
  roomFieldsDisabled = false,
  submitDisabled = false,
  submitLabel,
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
  const controlsDisabled = loading || roomFieldsDisabled

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
            disabled={controlsDisabled}
            maxLength={50}
            placeholder="Ví dụ: A101"
            {...register('roomNumber')}
          />
        </Field>
        <Field error={errors.name?.message} label="Tên phòng" required>
          <Input
            autoComplete="off"
            disabled={controlsDisabled}
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
          <Select disabled={controlsDisabled} {...register('roomTypeId')}>
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
            <Select disabled={controlsDisabled} {...register('status')}>
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
          disabled={controlsDisabled}
          maxLength={10_000}
          placeholder="Mô tả vị trí, không gian và tiện nghi của phòng"
          {...register('description')}
        />
      </Field>

      {!initialValue && imagePicker ? imagePicker : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button disabled={loading} onClick={onCancel} variant="outline">
          Hủy
        </Button>
        <Button disabled={submitDisabled} loading={loading} type="submit">
          {submitLabel ?? (initialValue ? 'Lưu thay đổi' : 'Tạo phòng')}
        </Button>
      </div>
    </form>
  )
}
