export interface CounterRoomAvailabilityState {
  isFetching: boolean
  isSuccess: boolean
}

export function nightsBetween(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) {
    return 0
  }

  const start = Date.parse(`${checkIn}T00:00:00.000Z`)
  const end = Date.parse(`${checkOut}T00:00:00.000Z`)

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0
  }

  return Math.round((end - start) / 86_400_000)
}

export function isAvailabilityCriteriaValid(
  checkIn?: string,
  checkOut?: string,
  guests?: number,
) {
  return (
    nightsBetween(checkIn, checkOut) > 0 &&
    typeof guests === 'number' &&
    Number.isInteger(guests) &&
    guests >= 1
  )
}
