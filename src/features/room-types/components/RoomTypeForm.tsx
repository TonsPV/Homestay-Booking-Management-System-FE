import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/shared/components/Button'
import {
  Field,
  Input,
  Textarea,
} from '@/shared/components/FormControls'

import {
  roomTypeFormSchema,
  type RoomTypeFormValues,
} from '../schemas'
import type { AdminRoomType, CreateRoomTypeInput } from '../types'

interface RoomTypeFormProps {
  initialValue?: AdminRoomType
  loading?: boolean
  onCancel: () => void
  onSubmit: (input: CreateRoomTypeInput) => Promise<void> | void
}

export function RoomTypeForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
}: RoomTypeFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RoomTypeFormValues>({
    defaultValues: {
      basePrice: initialValue?.basePrice ?? '',
      description: initialValue?.description ?? '',
      maxGuests: initialValue ? String(initialValue.maxGuests) : '',
      name: initialValue?.name ?? '',
    },
    resolver: zodResolver(roomTypeFormSchema),
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          basePrice: values.basePrice,
          description: values.description || null,
          maxGuests: Number(values.maxGuests),
          name: values.name,
        })
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          error={errors.name?.message}
          label="Tên loại phòng"
          required
        >
          <Input
            autoComplete="off"
            maxLength={120}
            placeholder="Ví dụ: Phòng gia đình"
            {...register('name')}
          />
        </Field>
        <Field
          error={errors.maxGuests?.message}
          label="Số khách tối đa"
          required
        >
          <Input
            inputMode="numeric"
            min={1}
            step={1}
            type="number"
            {...register('maxGuests')}
          />
        </Field>
      </div>

      <Field
        error={errors.basePrice?.message}
        hint="Nhập số tiền theo VND, tối đa 2 chữ số thập phân."
        label="Giá cơ bản"
        required
      >
        <Input
          inputMode="decimal"
          min={0}
          placeholder="1250000"
          step="0.01"
          type="number"
          {...register('basePrice')}
        />
      </Field>

      <Field
        error={errors.description?.message}
        label="Mô tả"
      >
        <Textarea
          maxLength={10_000}
          placeholder="Mô tả tiện nghi và đặc điểm của loại phòng"
          {...register('description')}
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          disabled={loading}
          onClick={onCancel}
          variant="outline"
        >
          Hủy
        </Button>
        <Button loading={loading} type="submit">
          {initialValue ? 'Lưu thay đổi' : 'Tạo loại phòng'}
        </Button>
      </div>
    </form>
  )
}
