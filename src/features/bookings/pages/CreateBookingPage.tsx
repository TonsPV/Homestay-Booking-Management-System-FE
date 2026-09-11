import { zodResolver } from '@hookform/resolvers/zod'
import { BedDouble, CalendarDays, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { getApiFieldErrorCode } from '@/api/errors'
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
import { LinkButton } from '@/shared/components/LinkButton'
import { RoomImage } from '@/features/rooms/components/RoomImage'
import { countStayNights } from '@/features/rooms/components/room-stay'
import { resolveRoomImageUrl } from '@/features/rooms/image-url'
import {
  formatDateOnly,
  formatMoney,
  formatNumber,
} from '@/shared/formatting/formatters'

import {
  buildRoomSearchUrl,
  getCustomerBookingActionError,
  isBookingRoomConflictError,
} from '../errors'
import { useCreateCustomerBooking } from '../hooks'
import {
  createBookingFormSchema,
  type CreateBookingFormValues,
} from '../schemas'

interface BookingLocationState {
  bookingDetailPath?: string
  room?: {
    amenities?: string[]
    basePrice?: string
    coverImageUrl?: string
    description?: string
    id: string
    maxGuests?: number
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

function formatStayDate(value: string) {
  return value ? formatDateOnly(value) : 'Chọn ngày'
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
    clearErrors,
    setError,
    watch,
  } = useForm<CreateBookingFormValues>({
    defaultValues,
    resolver: zodResolver(createBookingFormSchema),
  })
  const serverField = (
    [
      'checkInDate',
      'checkOutDate',
      'guestCount',
      'contactName',
      'contactPhone',
      'contactEmail',
    ] as const
  ).find((field) => getApiFieldErrorCode(createMutation.error, field))
  const bookingForSomeoneElse = watch('bookingForSomeoneElse')
  const isConflict = isBookingRoomConflictError(createMutation.error)
  const checkInDate = watch('checkInDate')
  const checkOutDate = watch('checkOutDate')
  const guestCount = watch('guestCount')
  const otherRoomsUrl = buildRoomSearchUrl({
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: guestCount,
  })
  const stayNights = countStayNights({
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: guestCount,
  })
  const displayedGuestCount =
    Number.isInteger(guestCount) && guestCount > 0 ? guestCount : null
  const selectedRoom = state?.room
  const roomName = selectedRoom?.name ?? `Phòng ${roomId}`

  useEffect(() => {
    if (!serverField || isConflict) {
      return
    }

    setError(
      serverField,
      {
        type: 'server',
        message: getCustomerBookingActionError(createMutation.error),
      },
      { shouldFocus: true },
    )
  }, [createMutation.error, isConflict, serverField, setError])

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return (
      <ErrorState description="Không xác định được phòng cần đặt. Vui lòng quay lại danh sách phòng và chọn lại." />
    )
  }

  const submit = handleSubmit((values) => {
    createMutation.reset()
    clearErrors([
      'checkInDate',
      'checkOutDate',
      'guestCount',
      'contactName',
      'contactPhone',
      'contactEmail',
    ])
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
            {
              replace: true,
              state: { bookingCreated: true },
            },
          )
        },
      },
    )
  })

  return (
    <div className="mx-auto grid min-w-0 max-w-6xl gap-8 lg:gap-10">
      <PageHeader
        breadcrumbs={[
          { label: 'Khám phá phòng', to: '/rooms' },
          { label: 'Xác nhận đặt phòng' },
        ]}
        eyebrow="Đặt phòng"
        title="Xác nhận kỳ nghỉ"
        description="Rà soát kỳ lưu trú và thông tin người ở trước khi gửi yêu cầu. Giá và tình trạng phòng sẽ được Backend kiểm tra lại."
      />

      {createMutation.isError && (!serverField || isConflict) ? (
        <Alert tone="error">
          <p>{getCustomerBookingActionError(createMutation.error)}</p>
          {isConflict ? (
            <div className="mt-3">
              <LinkButton to={otherRoomsUrl} variant="outline">
                Tìm phòng khác
              </LinkButton>
            </div>
          ) : null}
        </Alert>
      ) : null}

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] xl:gap-8">
        <Card className="border-line p-0 shadow-elevation-2">
          <form className="grid gap-8 p-5 sm:p-7 lg:p-8" onSubmit={submit}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-ink">
                  Hoàn thiện thông tin lưu trú
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                  Bạn có thể chỉnh ngày hoặc số khách trước khi tạo đặt phòng.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-strong">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Đã chọn phòng
              </span>
            </div>

            <section
              aria-labelledby="booking-stay-details"
              className="grid gap-5 rounded-card bg-surface-muted p-4 sm:p-5"
            >
              <div className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand text-white">
                  <CalendarDays aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-ink" id="booking-stay-details">
                    Thời gian lưu trú
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Ngày trả phòng cần sau ngày nhận phòng.
                  </p>
                </div>
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

              <p
                aria-live="polite"
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control bg-surface px-3.5 py-3 text-sm text-muted shadow-elevation-1"
                role="status"
              >
                <CalendarDays aria-hidden="true" className="size-4 text-brand" />
                {stayNights !== null ? (
                  <>
                    <span>
                      Kỳ lưu trú <strong className="font-bold text-ink">{formatNumber(stayNights)} đêm</strong>
                    </span>
                    {displayedGuestCount !== null ? (
                      <span>· {formatNumber(displayedGuestCount)} khách</span>
                    ) : null}
                  </>
                ) : (
                  <span>Chọn đủ ngày để xem số đêm lưu trú.</span>
                )}
              </p>
            </section>

            <section
              aria-labelledby="booking-contact-details"
              className="grid gap-5"
            >
              <div>
                <h3 className="font-bold text-ink" id="booking-contact-details">
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
                    Thông tin trong hồ sơ của bạn sẽ được dùng mặc định. Chỉ
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
              className="grid gap-5"
            >
              <div>
                <h3 className="font-bold text-ink" id="booking-note">
                  Yêu cầu thêm
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Ghi chú sẽ được gửi cùng yêu cầu đặt phòng để nơi lưu trú tham khảo.
                </p>
              </div>
              <Field
                label="Ghi chú"
                error={errors.customerNote?.message}
                hint="Ví dụ: ưu tiên phòng yên tĩnh hoặc tầng thấp."
              >
                <Textarea {...register('customerNote')} />
              </Field>
            </section>

            <div className="flex flex-col gap-4 rounded-card bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-bold text-ink">Sẵn sàng xác nhận?</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Sau khi tạo, bạn sẽ xem được trạng thái và bước tiếp theo trong chi tiết đặt phòng.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  className="min-h-11 shrink-0 whitespace-nowrap sm:min-w-28"
                  onClick={() => navigate(-1)}
                  variant="outline"
                >
                  Quay lại
                </Button>
                <Button
                  className="min-h-11 shrink-0 whitespace-nowrap sm:px-7"
                  loading={createMutation.isPending}
                  type="submit"
                >
                  Tạo đặt phòng
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <Card className="overflow-hidden border-line p-0 shadow-elevation-2">
            <div className="relative aspect-[16/9] bg-surface-muted">
              {selectedRoom?.coverImageUrl ? (
                <RoomImage
                  alt={`Ảnh ${roomName}`}
                  className="size-full object-cover"
                  fallbackLabel="Không thể tải ảnh phòng"
                  src={resolveRoomImageUrl(selectedRoom.coverImageUrl)}
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 bg-brand-soft text-center text-brand-strong">
                  <BedDouble aria-hidden="true" className="size-8" />
                  <span className="text-sm font-semibold">Phòng bạn đã chọn</span>
                </div>
              )}
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
                Phòng đã chọn
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink">
                {roomName}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {selectedRoom?.roomNumber
                  ? `Phòng ${selectedRoom.roomNumber}`
                  : `Mã phòng ${roomId}`}
                {selectedRoom?.roomTypeName
                  ? ` · ${selectedRoom.roomTypeName}`
                  : ''}
              </p>

              {selectedRoom?.description ? (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                  {selectedRoom.description}
                </p>
              ) : null}

              {selectedRoom?.amenities?.length ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tiện nghi nổi bật">
                  {selectedRoom.amenities.map((amenity) => (
                    <li
                      className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink"
                      key={amenity}
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : null}

              <section aria-label="Tóm tắt kỳ lưu trú" className="mt-5">
                <dl aria-live="polite" className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-control bg-surface-muted px-3 py-3">
                    <dt className="text-xs font-semibold text-muted">Nhận phòng</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">
                      {formatStayDate(checkInDate)}
                    </dd>
                  </div>
                  <div className="rounded-control bg-surface-muted px-3 py-3">
                    <dt className="text-xs font-semibold text-muted">Trả phòng</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">
                      {formatStayDate(checkOutDate)}
                    </dd>
                  </div>
                  <div className="rounded-control bg-surface-muted px-3 py-3">
                    <dt className="text-xs font-semibold text-muted">Số đêm</dt>
                    <dd className="mt-1 text-sm font-bold text-ink">
                      {stayNights !== null ? `${formatNumber(stayNights)} đêm` : '—'}
                    </dd>
                  </div>
                  <div className="rounded-control bg-surface-muted px-3 py-3">
                    <dt className="text-xs font-semibold text-muted">Số khách</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink">
                      <Users aria-hidden="true" className="size-4 text-brand" />
                      {displayedGuestCount !== null
                        ? `${formatNumber(displayedGuestCount)} khách`
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </section>

              {selectedRoom?.maxGuests ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Users aria-hidden="true" className="size-4" />
                  Tối đa {formatNumber(selectedRoom.maxGuests)} khách
                </p>
              ) : null}

              {selectedRoom?.basePrice ? (
                <div className="mt-5 rounded-card bg-brand-soft p-4">
                  <p className="text-sm font-semibold text-ink">Giá cơ sở</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
                    {formatMoney(selectedRoom.basePrice)}
                    <span className="ml-1 text-sm font-semibold text-muted">/ đêm</span>
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Tổng tiền được Backend xác nhận khi bạn gửi yêu cầu.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
          <section className="mt-4 flex gap-3 rounded-card border border-brand/20 bg-brand-soft p-4" aria-label="Lưu ý xác nhận đặt phòng">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <h2 className="font-bold text-ink">Thông tin được kiểm tra lại</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Phòng trống, giá và điều kiện đặt phòng chỉ được xác nhận sau khi hệ thống nhận yêu cầu.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
