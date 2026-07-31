import { appConfig } from '@/app/config'

import type {
  DateOnly,
  MoneyString,
  UtcDateTime,
} from '../types/primitives'

export function formatMoney(value: MoneyString | null | undefined) {
  if (!value) {
    return '—'
  }

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value)

  if (!match) {
    return value
  }

  const [, sign, integer, fraction = ''] = match
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const meaningfulFraction = fraction.replace(/0+$/, '')
  const decimal = meaningfulFraction ? `,${meaningfulFraction}` : ''

  return `${sign}${groupedInteger}${decimal} ₫`
}

export function formatDateOnly(value: DateOnly | null | undefined) {
  if (!value) {
    return '—'
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

export function formatDateTime(value: UtcDateTime | null | undefined) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(appConfig.locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: appConfig.timeZone,
  }).format(date)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(appConfig.locale).format(value)
}
