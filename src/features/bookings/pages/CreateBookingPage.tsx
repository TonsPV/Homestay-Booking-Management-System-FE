import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
} from '@/shared/components/Feedback'
import {
  Field,
  Input,
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'

import { getBookingActionError } from '../errors'
import { useCreateCustomerBooking } from '../hooks'
import {
  createBookingFormSchema,
  type CreateBookingFormValues,
} from '../schemas'

interface BookingLocationState {
  bookingDetailPath?: string
  room?: {
    id: string
    name: string
    roomNumber?: string
    roomTypeName?: string
  }
  search?: {
    checkIn?: string
    checkOut?: string
    guests?: number
  }
}

function getVietnamToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function CreateBookingPage() {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const createMutation = useCreateCustomerBooking()
  const state = location.state as BookingLocationState | null
  const roomId =
    params.roomId ??
    searchParams.get('roomId') ??
    state?.room?.id
  const guestParam = Number(
    searchParams.get('guests') ?? state?.search?.guests ?? 1,
  )
  const defaultValues = useMemo<CreateBookingFormValues>(
    () => ({
      checkInDate:
        searchParams.get('checkIn') ?? state?.search?.checkIn ?? '',
      checkOutDate:
        searchParams.get('checkOut') ?? state?.search?.checkOut ?? '',
      bookingForSomeoneElse: false,
      guestCount:
        Number.isInteger(guestParam) && guestParam > 0 ? guestParam : 1,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      customerNote: '',
    }),
    [guestParam, searchParams, state?.search],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<CreateBookingFormValues>({
    defaultValues,
    resolver: zodResolver(createBookingFormSchema),
  })
  const bookingForSomeoneElse = watch('bookingForSomeoneElse')

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return (
      <ErrorState description="Không xác định được phòng cần đặt. Vui lòng quay lại danh sách phòng và chọn lại." />
    )
  }

  const submit = handleSubmit((values) => {
    createMutation.mutate(
      {
        roomId,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        guestCount: values.guestCount,
        contactName: values.bookingForSomeoneElse
          ? optionalValue(values.contactName)
          : undefined,
        contactPhone: values.bookingForSomeoneElse
          ? optionalValue(values.contactPhone)
          : undefined,
        contactEmail: values.bookingForSomeoneElse
          ? (optionalValue(values.contactEmail) ?? null)
          : undefined,
        customerNote: optionalValue(values.customerNote),
      },
      {
        onSuccess: (booking) => {
          navigate(
            state?.bookingDetailPath ?? `/bookings/${booking.id}`,
            { replace: true },
          )
        },
      },
    )
  })

  return (
    <div className="grid min-w-0 gap-7">
      <PageHeader
        eyebrow="Đặt phòng"
        title="Xác nhận kỳ nghỉ"
        description="Giá và tình trạng phòng sẽ được máy chủ kiểm tra lại khi bạn gửi yêu cầu."
      />

      {createMutation.isError ? (
        <Alert tone="error">{getBookingActionError(createMutation.error)}</Alert>
      ) : null}

      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
        <Card className="overflow-hidden border-line p-0 shadow-card">
          <div className="border-b border-line bg-brand-soft px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">
              Thông tin đặt phòng
            </p>
            <h2 className="mt-1 text-xl font-black text-ink">
              Chi tiết kỳ nghỉ
            </h2>
          </div>

          <form className="grid gap-7 p-5 sm:p-7" onSubmit={submit}>
            <section
              aria-labelledby="booking-stay-details"
              className="grid gap-5"
            >
              <div>
                <h3
                  className="font-black text-ink"
                  id="booking-stay-details"
                >
                  Thời gian và số khách
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Kiểm tra lại thông tin trước khi gửi yêu cầu.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  required
                  label="Ngày nhận phòng"
                  error={errors.checkInDate?.message}
                >
                  <Input
                    {...register('checkInDate')}
                    min={getVietnamToday()}
                    type="date"
                  />
                </Field>
                <Field
                  required
                  label="Ngày trả phòng"
                  error={errors.checkOutDate?.message}
                >
                  <Input {...register('checkOutDate')} type="date" />
                </Field>
              </div>

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
            </section>

            <section
              aria-labelledby="booking-contact-details"
              className="grid gap-5 border-t border-line pt-7"
            >
              <div>
                <h3
                  className="font-black text-ink"
                  id="booking-contact-details"
                >
                  Thông tin người lưu trú
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Chỉ bổ sung khi bạn đặt phòng thay cho người khác.
                </p>
              </div>

              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-card border border-line bg-surface-muted p-4 transition-colors hover:border-brand/30 hover:bg-brand-soft">
                <input
                  className="mt-1 size-4 shrink-0 rounded border-line accent-brand"
                  type="checkbox"
                  {...register('bookingForSomeoneElse')}
                />
                <span>
                  <span className="block font-bold text-ink">
                    Đặt phòng cho người khác
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Mặc định hệ thống dùng thông tin trong hồ sơ của bạn. Chỉ
                    bật tùy chọn này khi người lưu trú là người khác.
                  </span>
                </span>
              </label>

              {bookingForSomeoneElse ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Tên người lưu trú"
                      error={errors.contactName?.message}
                      required
                    >
                      <Input
                        {...register('contactName')}
                        autoComplete="name"
                      />
                    </Field>
                    <Field
                      label="Số điện thoại"
                      error={errors.contactPhone?.message}
                      required
                    >
                      <Input
                        {...register('contactPhone')}
                        autoComplete="tel"
                      />
                    </Field>
                  </div>
                  <Field label="Email" error={errors.contactEmail?.message}>
                    <Input
                      {...register('contactEmail')}
                      autoComplete="email"
                      type="email"
                    />
                  </Field>
                </>
              ) : null}
            </section>

            <section
              aria-labelledby="booking-note"
              className="grid gap-5 border-t border-line pt-7"
            >
              <h3 className="font-black text-ink" id="booking-note">
                Yêu cầu thêm
              </h3>
              <Field
                label="Ghi chú"
                error={errors.customerNote?.message}
                hint="Ví dụ: ưu tiên phòng yên tĩnh hoặc tầng thấp."
              >
                <Textarea {...register('customerNote')} />
              </Field>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-7 sm:flex-row">
              <Button
                className="min-h-11 sm:min-w-28"
                onClick={() => navigate(-1)}
                variant="outline"
              >
                Quay lại
              </Button>
              <Button
                className="min-h-11 flex-1 sm:flex-none sm:px-7"
                loading={createMutation.isPending}
                type="submit"
              >
                Tạo đặt phòng
              </Button>
            </div>
          </form>
        </Card>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <Card className="overflow-hidden border-line bg-brand-soft p-0 shadow-card">
            <div className="border-b border-line p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand">
                Phòng đã chọn
              </p>
              <h2 className="mt-2 text-xl font-black text-ink">
                {state?.room?.name ?? `Phòng ${roomId}`}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {state?.room?.roomNumber
                  ? `Phòng ${state.room.roomNumber}`
                  : `Mã phòng ${roomId}`}
                {state?.room?.roomTypeName
                  ? ` · ${state.room.roomTypeName}`
                  : ''}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm leading-6 text-muted">
                Giá và tình trạng phòng được xác nhận lại khi yêu cầu được gửi.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
