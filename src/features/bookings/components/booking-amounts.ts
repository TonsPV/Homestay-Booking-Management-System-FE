import type { Booking } from '../types'

function splitBookingAmount(value: string): { integer: string; fraction: string } | null {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value.trim())

  if (!match) {
    return null
  }

  return { fraction: match[2] ?? '', integer: match[1] }
}

function normalizeInteger(value: string) {
  return value.replace(/^0+(?=\d)/, '')
}

function addAmounts(total: { fraction: string; integer: string }, value: string) {
  const parts = splitBookingAmount(value)

  if (!parts) {
    return total
  }

  const leftFraction = total.fraction
  const rightFraction = parts.fraction
  const fractionLength = Math.max(leftFraction.length, rightFraction.length)
  const leftPadded = leftFraction.padEnd(fractionLength, '0')
  const rightPadded = rightFraction.padEnd(fractionLength, '0')

  // Column addition over decimal strings: integer-digits only inputs keep the
  // fraction empty, so carry flows from the right across the padded fraction.
  let carry = 0
  let fraction = ''

  for (let index = fractionLength - 1; index >= 0; index -= 1) {
    const sum = carry + (leftPadded.charCodeAt(index) - 48) + (rightPadded.charCodeAt(index) - 48)
    fraction = `${sum % 10}${fraction}`
    carry = Math.floor(sum / 10)
  }

  const leftInteger = normalizeInteger(total.integer)
  const rightInteger = normalizeInteger(parts.integer)
  let integer = ''
  let leftIndex = leftInteger.length - 1
  let rightIndex = rightInteger.length - 1

  while (leftIndex >= 0 || rightIndex >= 0) {
    const sum = carry + (leftIndex >= 0 ? leftInteger.charCodeAt(leftIndex) - 48 : 0)
      + (rightIndex >= 0 ? rightInteger.charCodeAt(rightIndex) - 48 : 0)
    integer = `${sum % 10}${integer}`
    carry = Math.floor(sum / 10)
    leftIndex -= 1
    rightIndex -= 1
  }

  if (carry > 0) {
    integer = `${carry}${integer}`
  }

  return { fraction, integer }
}

/**
 * String-based total of the decimal `totalAmount` values on the current page.
 * Sums digit columns instead of parsing floats so VND amounts cannot drift,
 * matching how the Backend serialises money.
 */
export function sumBookingAmounts(bookings: Booking[]): string {
  let total = { fraction: '', integer: '0' }

  for (const booking of bookings) {
    total = addAmounts(total, booking.totalAmount)
  }

  const fraction = total.fraction.replace(/0+$/, '')

  return fraction ? `${total.integer}.${fraction}` : total.integer
}
