import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/shared/components/Button'
import { Field, Input, Textarea } from '@/shared/components/FormControls'

import { amenityFormSchema, type AmenityFormValues } from '../schemas'
import type { AdminAmenity, CreateAmenityInput } from '../types'

interface AmenityFormProps {
  initialValue?: AdminAmenity
  loading?: boolean
  onCancel: () => void
  onSubmit: (input: CreateAmenityInput) => Promise<void> | void
}

export function AmenityForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
}: AmenityFormProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AmenityFormValues>({
    defaultValues: {
      description: initialValue?.description ?? '',
      name: initialValue?.name ?? '',
    },
    resolver: zodResolver(amenityFormSchema),
  })

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) =>
        onSubmit({
          description: values.description || null,
          name: values.name,
        }),
      )}
    >
      <Field error={errors.name?.message} label="Tên tiện nghi" required>
        <Input
          autoComplete="off"
          maxLength={120}
          placeholder="Ví dụ: Wi-Fi, điều hòa, ban công"
          {...register('name')}
        />
      </Field>
      <Field error={errors.description?.message} label="Mô tả">
        <Textarea
          maxLength={500}
          placeholder="Thông tin ngắn giúp khách hiểu tiện nghi này"
          {...register('description')}
        />
      </Field>
      <div className="flex flex-wrap justify-end gap-3">
        <Button disabled={loading} onClick={onCancel} type="button" variant="outline">
          Hủy
        </Button>
        <Button loading={loading} type="submit">
          {initialValue ? 'Lưu thay đổi' : 'Tạo tiện nghi'}
        </Button>
      </div>
    </form>
  )
}
