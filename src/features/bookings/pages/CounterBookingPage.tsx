import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { getApiFieldErrorCode } from '@/api/errors'
import type { Room } from '@/features/rooms/types'
import { Button } from '@/shared/components/Button'
import { Alert } from '@/shared/components/Feedback'
import { Field, Input, Textarea } from '@/shared/components/FormControls'

import { CounterBookingSummary } from '../components/CounterBookingSummary'
import { CounterRoomPicker } from '../components/CounterRoomPicker'
import {
  type CounterRoomAvailabilityState,
  isAvailabilityCriteriaValid,
} from '../components/counterRoomAvailability'
import { getBookingActionError } from '../errors'
import { useCreateManagementBooking } from '../hooks'
import {
  createManagementBookingFormSchema,
  type CreateManagementBookingFormValues,
} from '../schemas'

/*
 * THESIS: A compact booking workbench keeps room discovery and booking decisions in one view.
 * HIERARCHY: Stay criteria and room results lead; the sticky confirmation panel supports them.
 * INTERACTION: Selecting a room reveals customer fields and unlocks the final action progressively.
 * DEPTH: Soft surfaces and elevation replace nested borders; blue is reserved for selection and CTA.
 * RESPONSIVE: Desktop uses a 70/30 split; mobile stacks and keeps the primary action above navigation.
 */

function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

function WorkflowProgress({ current }: { current: number }) {
  const steps = ['Kỳ lưu trú', 'Chọn phòng', 'Thông tin khách', 'Hoàn tất']

  return (
    <ol aria-label="Tiến trình tạo booking" className="grid grid-cols-4 gap-2">
      {steps.map((label, index) => {
        const step = index + 1
        const completed = step < current
        const active = step === current

        return (
          <li className="min-w-0" key={label}>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-black ${
                  completed || active
                    ? 'bg-brand text-white'
                    : 'bg-surface-muted text-muted'
                }`}
              >
                {completed ? '✓' : step}
              </span>
              <span
                className={`truncate text-xs font-bold sm:text-sm ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            <div
              aria-hidden="true"
              className={`mt-2 h-0.5 rounded ${
                completed ? 'bg-brand' : 'bg-surface-muted'
              }`}
            />
          </li>
        )
      })}
    </ol>
  )
}

export function CounterBookingPage() {
  const navigate = useNavigate()
  const createMutation = useCreateManagementBooking()
  const [selectedRoom, setSelectedRoom] = useState<Room>()
  const [roomPage, setRoomPage] = useState(1)
  const [summaryOpen, setSummaryOpen] = useState(true)
  const bookingPanelRef = useRef<HTMLElement>(null)
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
    clearErrors,
    setError,
    setValue,
    watch,
  } = useForm<CreateManagementBookingFormValues>({
    defaultValues: {
      checkInDate: '',
      checkOutDate: '',
      guestCount: 1,
      roomId: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      customerNote: '',
    },
    mode: 'onChange',
    resolver: zodResolver(createManagementBookingFormSchema),
  })
  const serverField = (
    [
      'roomId',
      'checkInDate',
      'checkOutDate',
      'guestCount',
      'contactName',
      'contactPhone',
      'contactEmail',
    ] as const
  ).find((field) => getApiFieldErrorCode(createMutation.error, field))
  const checkInDate = watch('checkInDate')
  const checkOutDate = watch('checkOutDate')
  const guestCount = watch('guestCount')
  const contactName = watch('contactName')
  const contactPhone = watch('contactPhone')
  const stayReady = isAvailabilityCriteriaValid(
    checkInDate,
    checkOutDate,
    guestCount,
  )
  const customerReady =
    contactName.trim().length > 0 && contactPhone.trim().length > 0
  const currentStep = !stayReady
    ? 1
    : !selectedRoom
      ? 2
      : !customerReady
        ? 3
        : 4

  const [availability, setAvailability] =
    useState<CounterRoomAvailabilityState>({
      isFetching: false,
      isSuccess: false,
    })
  const handleAvailabilityStateChange = useCallback(
    (state: CounterRoomAvailabilityState) => setAvailability(state),
    [],
  )

  const criteriaRef = useRef({ checkInDate, checkOutDate, guestCount })
  useEffect(() => {
    const previous = criteriaRef.current
    const changed =
      previous.checkInDate !== checkInDate ||
      previous.checkOutDate !== checkOutDate ||
      previous.guestCount !== guestCount

    criteriaRef.current = { checkInDate, checkOutDate, guestCount }

    if (changed) {
      setSelectedRoom(undefined)
      setValue('roomId', '')
      setRoomPage(1)
    }
  }, [checkInDate, checkOutDate, guestCount, setValue])

  useEffect(() => {
    if (!serverField) return

    setError(
      serverField,
      { type: 'server', message: getBookingActionError(createMutation.error) },
      { shouldFocus: true },
    )
  }, [createMutation.error, serverField, setError])

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room)
    setValue('roomId', room.id, { shouldValidate: true })

    const desktop =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(min-width: 1280px)').matches
    if (!desktop) {
      window.requestAnimationFrame(() =>
        bookingPanelRef.current?.scrollIntoView?.({
          behavior:
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
          block: 'start',
        }),
      )
    }
  }

  const canSubmit =
    selectedRoom !== undefined &&
    availability.isSuccess &&
    !availability.isFetching &&
    !createMutation.isPending &&
    isValid

  const submit = handleSubmit((values) => {
    if (
      selectedRoom === undefined ||
      values.roomId !== selectedRoom.id ||
      !availability.isSuccess ||
      availability.isFetching ||
      createMutation.isPending
    ) {
      return
    }

    createMutation.reset()
    clearErrors([
      'roomId',
      'checkInDate',
      'checkOutDate',
      'guestCount',
      'contactName',
      'contactPhone',
      'contactEmail',
    ])

    createMutation.mutate(
      {
        roomId: values.roomId,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        guestCount: values.guestCount,
        contactName: optionalValue(values.contactName),
        contactPhone: optionalValue(values.contactPhone),
        contactEmail: optionalValue(values.contactEmail),
        customerNote: optionalValue(values.customerNote),
      },
      {
        onSuccess: (booking) =>
          navigate(`/staff/bookings/${booking.id}`, { replace: true }),
      },
    )
  })

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(32rem,0.8fr)] lg:items-end">
        <div>
          <p className="text-sm font-bold text-brand-strong">Quầy lễ tân</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Tạo booking
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Chọn kỳ lưu trú và phòng phù hợp. Thông tin khách và xác nhận nằm
            trong cùng một panel.
          </p>
        </div>
        <WorkflowProgress current={currentStep} />
      </header>

      {createMutation.isError && !serverField ? (
        <Alert tone="error">
          {getBookingActionError(createMutation.error)}
        </Alert>
      ) : null}

      <form noValidate onSubmit={submit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)] xl:items-start">
          <div className="grid min-w-0 gap-6">
            <section
              aria-labelledby="stay-search-heading"
              className="rounded-panel bg-surface p-4 shadow-elevation-1 sm:p-6"
            >
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2
                    className="text-lg font-black text-ink"
                    id="stay-search-heading"
                  >
                    Kỳ lưu trú
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Phòng trống được cập nhật tự động.
                  </p>
                </div>
                <span className="hidden text-xs font-bold text-muted sm:block">
                  BƯỚC 1
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
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
            </section>

            <section
              aria-labelledby="room-picker-heading"
              className="grid gap-4"
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2
                    className="text-xl font-black text-ink"
                    id="room-picker-heading"
                  >
                    Chọn phòng
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    So sánh nhanh sức chứa, tiện nghi và giá cơ bản.
                  </p>
                </div>
                <span className="text-xs font-bold text-muted">BƯỚC 2</span>
              </div>
              {errors.roomId ? (
                <Alert tone="error">{errors.roomId.message}</Alert>
              ) : null}
              <CounterRoomPicker
                checkIn={checkInDate}
                checkOut={checkOutDate}
                guests={guestCount}
                onAvailabilityStateChange={handleAvailabilityStateChange}
                onPageChange={setRoomPage}
                onSelect={handleSelectRoom}
                page={roomPage}
                selectedRoomId={selectedRoom?.id}
              />
            </section>
          </div>

          <aside
            className="scroll-mt-24 xl:sticky xl:top-24"
            ref={bookingPanelRef}
          >
            <div className="rounded-panel bg-surface p-6 shadow-elevation-3">
              <details
                className="group"
                onToggle={(event) => setSummaryOpen(event.currentTarget.open)}
                open={summaryOpen}
              >
                <summary className="mb-4 flex cursor-pointer list-none items-center justify-between gap-3 xl:cursor-default">
                  <span className="text-xs font-black text-muted">
                    TÓM TẮT BOOKING
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-muted transition group-open:rotate-180 xl:hidden"
                  >
                    ⌄
                  </span>
                </summary>
                <CounterBookingSummary
                  checkIn={checkInDate}
                  checkOut={checkOutDate}
                  guests={guestCount}
                  room={selectedRoom}
                />
              </details>

              {selectedRoom ? (
                <section
                  className="mt-6 grid gap-4 border-t border-line pt-6"
                  aria-labelledby="customer-heading"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h2
                        className="text-base font-black text-ink"
                        id="customer-heading"
                      >
                        Thông tin khách
                      </h2>
                      <span className="text-xs font-bold text-muted">
                        BƯỚC 3
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Nhập số điện thoại để hệ thống tìm hoặc tạo hồ sơ khách.
                    </p>
                  </div>

                  <Field
                    required
                    label="Số điện thoại"
                    error={errors.contactPhone?.message}
                  >
                    <Input
                      {...register('contactPhone')}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </Field>
                  <Field
                    required
                    label="Họ tên khách"
                    error={errors.contactName?.message}
                  >
                    <Input {...register('contactName')} autoComplete="name" />
                  </Field>
                  <Field label="Email" error={errors.contactEmail?.message}>
                    <Input
                      {...register('contactEmail')}
                      autoComplete="email"
                      type="email"
                    />
                  </Field>
                  <Field label="Ghi chú" error={errors.customerNote?.message}>
                    <Textarea {...register('customerNote')} rows={2} />
                  </Field>
                </section>
              ) : null}

              <div className="fixed inset-x-0 bottom-[4.5rem] z-20 flex gap-3 border-t border-line bg-surface p-3 shadow-elevation-4 xl:static xl:mt-6 xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none">
                <Button
                  className="flex-1"
                  disabled={!canSubmit}
                  loading={createMutation.isPending}
                  type="submit"
                >
                  Tạo booking
                </Button>
                <Button
                  className="hidden xl:inline-flex"
                  onClick={() => navigate('/staff/bookings')}
                  variant="outline"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
