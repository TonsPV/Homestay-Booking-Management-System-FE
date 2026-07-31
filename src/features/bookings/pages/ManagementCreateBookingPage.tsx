import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import {
  Field,
  Input,
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'

import { getBookingActionError } from '../errors'
import { useCreateManagementBooking } from '../hooks'
import {
  createManagementBookingFormSchema,
  type CreateManagementBookingFormValues,
} from '../schemas'

function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function ManagementCreateBookingPage() {
  const navigate = useNavigate()
  const createMutation = useCreateManagementBooking()
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<CreateManagementBookingFormValues>({
    defaultValues: {
      checkInDate: '',
      checkOutDate: '',
      guestCount: 1,
      roomId: '',
      customerId: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      customerNote: '',
    },
    resolver: zodResolver(createManagementBookingFormSchema),
  })
  const existingCustomerId = watch('customerId')

  const submit = handleSubmit((values) => {
    createMutation.mutate(
      {
        roomId: values.roomId,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        guestCount: values.guestCount,
        customerId: optionalValue(values.customerId),
        contactName: optionalValue(values.contactName),
        contactPhone: optionalValue(values.contactPhone),
        contactEmail: optionalValue(values.contactEmail),
        customerNote: optionalValue(values.customerNote),
      },
      {
        onSuccess: (booking) =>
          navigate(`/management/bookings/${booking.id}`, { replace: true }),
      },
    )
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý booking"
        title="Tạo booking tại quầy"
        description="Có thể dùng mã khách hàng hiện có hoặc nhập thông tin để hệ thống tìm/tạo khách theo số điện thoại."
      />

      {createMutation.isError ? (
        <Alert tone="error">{getBookingActionError(createMutation.error)}</Alert>
      ) : null}

      <Card>
        <form className="grid gap-5" onSubmit={submit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              required
              label="Mã phòng"
              error={errors.roomId?.message}
            >
              <Input {...register('roomId')} inputMode="numeric" />
            </Field>
            <Field
              label="Mã khách hàng hiện có"
              error={errors.customerId?.message}
              hint="Để trống nếu cần tìm hoặc tạo khách theo số điện thoại."
            >
              <Input {...register('customerId')} inputMode="numeric" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              required
              label="Ngày nhận phòng"
              error={errors.checkInDate?.message}
            >
              <Input {...register('checkInDate')} type="date" />
            </Field>
            <Field
              required
              label="Ngày trả phòng"
              error={errors.checkOutDate?.message}
            >
              <Input {...register('checkOutDate')} type="date" />
            </Field>
            <Field
              required
              label="Số khách"
              error={errors.guestCount?.message}
            >
              <Input
                {...register('guestCount', { valueAsNumber: true })}
                min={1}
                step={1}
                type="number"
              />
            </Field>
          </div>

          <div className="border-t border-line pt-5">
            <h2 className="font-bold text-ink">Thông tin liên hệ</h2>
            <p className="mt-1 text-sm text-muted">
              {existingCustomerId
                ? 'Có thể để trống để dùng hồ sơ khách hàng, hoặc nhập để lưu snapshot riêng cho booking.'
                : 'Tên và số điện thoại là bắt buộc khi không dùng mã khách hàng.'}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              required={!existingCustomerId}
              label="Tên liên hệ"
              error={errors.contactName?.message}
            >
              <Input {...register('contactName')} autoComplete="name" />
            </Field>
            <Field
              required={!existingCustomerId}
              label="Số điện thoại"
              error={errors.contactPhone?.message}
            >
              <Input {...register('contactPhone')} autoComplete="tel" />
            </Field>
          </div>
          <Field label="Email" error={errors.contactEmail?.message}>
            <Input
              {...register('contactEmail')}
              autoComplete="email"
              type="email"
            />
          </Field>
          <Field label="Ghi chú" error={errors.customerNote?.message}>
            <Textarea {...register('customerNote')} />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button loading={createMutation.isPending} type="submit">
              Tạo booking
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
