import { formatNumber } from '@/shared/formatting/formatters'

export interface RoomStay {
  checkIn: string
  checkOut: string
  guests: number
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  )
}

/** Calendar-day difference on date-only strings, no timezone involvement. */
export function countStayNights(stay: RoomStay) {
  if (!isRealDate(stay.checkIn) || !isRealDate(stay.checkOut)) {
    return null
  }

  const nights =
    (Date.parse(`${stay.checkOut}T00:00:00.000Z`) -
      Date.parse(`${stay.checkIn}T00:00:00.000Z`)) /
    (24 * 60 * 60 * 1000)

  return Number.isInteger(nights) && nights > 0 ? nights : null
}

export function validateRoomStay(
  stay: RoomStay,
  maxGuests: number,
): Partial<Record<keyof RoomStay, string>> {
  const errors: Partial<Record<keyof RoomStay, string>> = {}

  if (stay.checkIn === '') {
    errors.checkIn = 'Vui lòng chọn ngày nhận phòng.'
  } else if (!isRealDate(stay.checkIn)) {
    errors.checkIn = 'Ngày nhận phòng không hợp lệ.'
  }

  if (stay.checkOut === '') {
    errors.checkOut = 'Vui lòng chọn ngày trả phòng.'
  } else if (!isRealDate(stay.checkOut)) {
    errors.checkOut = 'Ngày trả phòng không hợp lệ.'
  } else if (
    isRealDate(stay.checkIn) &&
    isRealDate(stay.checkOut) &&
    stay.checkOut <= stay.checkIn
  ) {
    errors.checkOut = 'Ngày trả phòng phải sau ngày nhận phòng.'
  }

  if (!Number.isInteger(stay.guests) || stay.guests < 1) {
    errors.guests = 'Số khách phải là số nguyên dương.'
  } else if (stay.guests > maxGuests) {
    errors.guests = `Phòng này chứa tối đa ${formatNumber(maxGuests)} khách.`
  }

  return errors
}
