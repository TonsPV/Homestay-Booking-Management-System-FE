import { useMemo } from 'react'

import { Field, Input } from '@/shared/components/FormControls'
import { Alert } from '@/shared/components/Feedback'
import { formatNumber } from '@/shared/formatting/formatters'

import {
  countStayNights,
  validateRoomStay,
  type RoomStay,
} from './room-stay'

interface RoomStayPickerProps {
  maxGuests: number
  onStayChange: (stay: RoomStay) => void
  stay: RoomStay
}

/**
 * Stay selector for the client room detail page (CLIENT-04). Date-only
 * inputs with native pickers, keyboard entry, and explicit guest controls
 * bounded by the published room capacity. Pure stay state lives in the
 * parent so the mobile action bar and this form share one source (CLIENT-08).
 */
export function RoomStayPicker({
  maxGuests,
  onStayChange,
  stay,
}: RoomStayPickerProps) {
  const errors = validateRoomStay(stay, maxGuests)
  const hasErrors = Object.keys(errors).length > 0
  const nights = countStayNights(stay)
  const guestsInvalid = errors.guests !== undefined

  const guestsHelper = useMemo(() => {
    if (guestsInvalid) {
      return errors.guests
    }

    return `Tối đa ${formatNumber(maxGuests)} khách`
  }, [errors.guests, guestsInvalid, maxGuests])

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.checkIn} label="Ngày nhận phòng">
          <Input
            max={stay.checkOut || undefined}
            onChange={(event) =>
              onStayChange({ ...stay, checkIn: event.target.value })
            }
            type="date"
            value={stay.checkIn}
          />
        </Field>
        <Field error={errors.checkOut} label="Ngày trả phòng">
          <Input
            min={stay.checkIn || undefined}
            onChange={(event) =>
              onStayChange({ ...stay, checkOut: event.target.value })
            }
            type="date"
            value={stay.checkOut}
          />
        </Field>
      </div>

      <Field
        error={guestsInvalid ? errors.guests : undefined}
        hint={guestsHelper}
        label="Số khách"
      >
        <div className="flex items-center gap-2">
          <button
            aria-label="Giảm số khách"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-line bg-surface font-black text-ink transition duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55"
            disabled={stay.guests <= 1}
            onClick={() =>
              onStayChange({ ...stay, guests: Math.max(stay.guests - 1, 1) })
            }
            type="button"
          >
            −
          </button>
          <Input
            aria-label="Số khách"
            className="max-w-24 text-center"
            inputMode="numeric"
            max={maxGuests}
            min={1}
            onChange={(event) => {
              const raw = event.target.value.trim()
              if (raw === '') {
                onStayChange({ ...stay, guests: Number.NaN })
                return
              }
              const parsed = Number(raw)
              onStayChange({
                ...stay,
                guests: Number.isInteger(parsed) ? parsed : Number.NaN,
              })
            }}
            type="number"
            value={Number.isNaN(stay.guests) ? '' : stay.guests}
          />
          <button
            aria-label="Tăng số khách"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-line bg-surface font-black text-ink transition duration-fast ease-calm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55"
            disabled={stay.guests >= maxGuests}
            onClick={() =>
              onStayChange({
                ...stay,
                guests: Math.min(stay.guests + 1, maxGuests),
              })
            }
            type="button"
          >
            +
          </button>
        </div>
      </Field>

      {nights !== null ? (
        <Alert tone="info">
          Kỳ lưu trú <strong>{formatNumber(nights)} đêm</strong> · từ{' '}
          {stay.checkIn.split('-').reverse().join('/')} đến{' '}
          {stay.checkOut.split('-').reverse().join('/')}
        </Alert>
      ) : null}

      {hasErrors ? (
        <p className="text-sm text-muted">
          Hoàn tất ngày và số khách để tiếp tục đặt phòng này.
        </p>
      ) : null}
    </div>
  )
}
