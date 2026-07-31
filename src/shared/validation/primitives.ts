import { z } from 'zod'

export const entityIdSchema = z.string().regex(/^[1-9][0-9]*$/)

export const moneyStringSchema = z
  .string()
  .regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/)

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }, 'Ngày không hợp lệ.')

export const vietnamesePhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}$/,
    'Số điện thoại Việt Nam không hợp lệ.',
  )
