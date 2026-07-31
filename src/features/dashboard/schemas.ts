import { z } from 'zod'

import { appConfig } from '@/app/config'

const DAY_IN_MILLISECONDS = 86_400_000
const MAX_RANGE_DAYS = 366
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRealDateOnly(value: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function dateOnlyInProductTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: appConfig.timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function createDefaultDashboardDateRange(now = new Date()) {
  const to = dateOnlyInProductTimeZone(now)

  return {
    from: `${to.slice(0, 7)}-01`,
    to,
  }
}

const dashboardDateSchema = z
  .string()
  .refine(isRealDateOnly, 'Ngày không hợp lệ.')

export const dashboardDateRangeSchema = z
  .object({
    from: dashboardDateSchema,
    to: dashboardDateSchema,
  })
  .superRefine((values, context) => {
    if (!isRealDateOnly(values.from) || !isRealDateOnly(values.to)) {
      return
    }

    if (values.from > values.to) {
      context.addIssue({
        code: 'custom',
        message: 'Ngày bắt đầu không được sau ngày kết thúc.',
        path: ['to'],
      })
      return
    }

    const fromTime = Date.parse(`${values.from}T00:00:00.000Z`)
    const toTime = Date.parse(`${values.to}T00:00:00.000Z`)
    const inclusiveDays =
      Math.floor((toTime - fromTime) / DAY_IN_MILLISECONDS) + 1

    if (inclusiveDays > MAX_RANGE_DAYS) {
      context.addIssue({
        code: 'custom',
        message: 'Khoảng báo cáo không được vượt quá 366 ngày.',
        path: ['to'],
      })
    }
  })

export type DashboardDateRangeValues = z.infer<
  typeof dashboardDateRangeSchema
>
