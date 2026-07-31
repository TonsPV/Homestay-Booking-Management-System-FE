import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import type { Room } from '@/features/rooms/types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import {
  Field,
  Input,
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'

import { CounterBookingSummary } from '../components/CounterBookingSummary'
import { CounterRoomPicker } from '../components/CounterRoomPicker'
import type { CounterRoomAvailabilityState } from '../components/counterRoomAvailability'
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
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>()
  const [roomPage, setRoomPage] = useState(1)
  const {
    formState: { errors },
    handleSubmit,
    register,
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
    resolver: zodResolver(createManagementBookingFormSchema),
  })
  const checkInDate = watch('checkInDate')
  const checkOutDate = watch('checkOutDate')
  const guestCount = watch('guestCount')
  const contactName = watch('contactName')
  const contactPhone = watch('contactPhone')
  const contactEmail = watch('contactEmail')

  const [availability, setAvailability] =
    useState<CounterRoomAvailabilityState>({
      isFetching: false,
      isSuccess: false,
    })
  const handleAvailabilityStateChange = useCallback(
    (state: CounterRoomAvailabilityState) => setAvailability(state),
    [],
  )

  // Clear the selected room whenever the stay criteria change so a stale
  // roomId from a previous availability result can never be submitted.
  // Changing only the result page keeps the selection intact.
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

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room)
    setValue('roomId', room.id, { shouldValidate: true })
  }

  const canSubmit =
    selectedRoom !== undefined &&
    availability.isSuccess &&
    !availability.isFetching &&
    !createMutation.isPending

  const submit = handleSubmit((values) => {
    // Re-check guard conditions inside the handler so a stale roomId or an
    // in-flight availability refresh can never slip through via keyboard
    // submit or a racing state update.
    if (
      selectedRoom === undefined ||
      values.roomId !== selectedRoom.id ||
      !availability.isSuccess ||
      availability.isFetching ||
      createMutation.isPending
    ) {
      return
    }

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
          navigate(`/management/bookings/${booking.id}`, { replace: true }),
      },
    )
  })

  const summary = (
    <CounterBookingSummary
      checkIn={checkInDate}
      checkOut={checkOutDate}
      contactEmail={contactEmail}
      contactName={contactName}
      contactPhone={contactPhone}
      guests={guestCount}
      room={selectedRoom}
    />
  )

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý booking"
        title="Tạo booking tại quầy"
        description="Chọn ngày và số khách để tìm phòng trống, sau đó nhập thông tin khách."
      />

      {createMutation.isError ? (
        <Alert tone="error">{getBookingActionError(createMutation.error)}</Alert>
      ) : null}

      <form onSubmit={submit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
          <Card className="grid gap-6">
            <section className="grid gap-4">
              <h2 className="font-bold text-ink">Thông tin lưu trú</h2>
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
            </section>

            <section className="grid gap-4 border-t border-line pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold text-ink">Chọn phòng</h2>
                {selectedRoom ? (
                  <p className="text-sm text-muted">
                    Đã chọn:{' '}
                    <strong className="text-ink">
                      Phòng {selectedRoom.roomNumber} · {selectedRoom.name}
                    </strong>
                  </p>
                ) : null}
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

            <section className="grid gap-4 border-t border-line pt-5">
              <div>
                <h2 className="font-bold text-ink">Thông tin khách</h2>
                <p className="mt-1 text-sm text-muted">
                  Nhập số điện thoại trước. Hệ thống sẽ tự tìm hoặc tạo hồ sơ
                  khách theo số này.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
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
            </section>
          </Card>

          <div className="grid gap-4 lg:sticky lg:top-6">
            {summary}
            <div className="flex flex-wrap gap-3">
              <Button
                className="flex-1"
                disabled={!canSubmit}
                loading={createMutation.isPending}
                type="submit"
              >
                Tạo booking
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline">
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
