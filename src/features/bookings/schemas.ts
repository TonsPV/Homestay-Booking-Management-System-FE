import { z } from 'zod'

import { appConfig } from '@/app/config'
import { dateOnlySchema } from '@/shared/validation/primitives'

import { BOOKING_STATUSES } from './types'

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message)

const optionalEmail = z
  .string()
  .trim()
  .max(160, 'Email không được vượt quá 160 ký tự.')
  .refine(
    (value) =>
      value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Email không hợp lệ.',
  )

const optionalPhone = z
  .string()
  .trim()
  .max(30, 'Số điện thoại không được vượt quá 30 ký tự.')
  .refine((value) => {
    if (value === '') {
      return true
    }

    const compact = value.replace(/[().\-\s]/g, '')
    return /^(?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}$/.test(compact)
  }, 'Số điện thoại Việt Nam không hợp lệ.')

const bookingFormShape = {
  checkInDate: dateOnlySchema,
  checkOutDate: dateOnlySchema,
  guestCount: z
    .number({ error: 'Số khách không hợp lệ.' })
    .int('Số khách phải là số nguyên.')
    .min(1, 'Cần ít nhất 1 khách.')
    .max(2_147_483_647, 'Số khách vượt quá giới hạn cho phép.'),
  contactName: optionalText(
    120,
    'Tên liên hệ không được vượt quá 120 ký tự.',
  ),
  contactPhone: optionalPhone,
  contactEmail: optionalEmail,
  customerNote: optionalText(
    10_000,
    'Ghi chú không được vượt quá 10.000 ký tự.',
  ),
}

function getProductToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: appConfig.timeZone,
    year: 'numeric',
  }).formatToParts(new Date())
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

function validateStay(
  values: { checkInDate: string; checkOutDate: string },
  context: z.RefinementCtx,
) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/

  if (
    !datePattern.test(values.checkInDate) ||
    !datePattern.test(values.checkOutDate)
  ) {
    return
  }

  if (values.checkInDate < getProductToday()) {
    context.addIssue({
      code: 'custom',
      message: 'Ngày nhận phòng không được ở trong quá khứ.',
      path: ['checkInDate'],
    })
  }

  if (values.checkOutDate <= values.checkInDate) {
    context.addIssue({
      code: 'custom',
      message: 'Ngày trả phòng phải sau ngày nhận phòng.',
      path: ['checkOutDate'],
    })
    return
  }

  const nights =
    (Date.parse(`${values.checkOutDate}T00:00:00.000Z`) -
      Date.parse(`${values.checkInDate}T00:00:00.000Z`)) /
    86_400_000

  if (nights > 90) {
    context.addIssue({
      code: 'custom',
      message: 'Thời gian lưu trú không được vượt quá 90 đêm.',
      path: ['checkOutDate'],
    })
  }
}

export const createBookingFormSchema = z
  .object({
    ...bookingFormShape,
    bookingForSomeoneElse: z.boolean(),
  })
  .superRefine((values, context) => {
    validateStay(values, context)

    if (values.bookingForSomeoneElse) {
      if (values.contactName === '') {
        context.addIssue({
          code: 'custom',
          message: 'Vui lòng nhập tên người lưu trú.',
          path: ['contactName'],
        })
      }

      if (values.contactPhone === '') {
        context.addIssue({
          code: 'custom',
          message: 'Vui lòng nhập số điện thoại người lưu trú.',
          path: ['contactPhone'],
        })
      }
    }
  })

export type CreateBookingFormValues = z.infer<
  typeof createBookingFormSchema
>

// Counter bookings are phone-first: the Backend matches or creates the
// Customer from the contact phone, so customerId stays out of the main flow.
export const createManagementBookingFormSchema = z
  .object({
    ...bookingFormShape,
    roomId: z.string().regex(/^[1-9][0-9]*$/, 'Mã phòng không hợp lệ.'),
  })
  .superRefine((values, context) => {
    validateStay(values, context)

    if (values.contactPhone === '') {
      context.addIssue({
        code: 'custom',
        message: 'Vui lòng nhập số điện thoại khách.',
        path: ['contactPhone'],
      })
    }

    if (values.contactName === '') {
      context.addIssue({
        code: 'custom',
        message: 'Vui lòng nhập họ tên khách.',
        path: ['contactName'],
      })
    }
  })

export type CreateManagementBookingFormValues = z.infer<
  typeof createManagementBookingFormSchema
>

export const cancelBookingFormSchema = z.object({
  reason: optionalText(500, 'Lý do hủy không được vượt quá 500 ký tự.'),
})

export type CancelBookingFormValues = z.infer<
  typeof cancelBookingFormSchema
>

export const updateBookingStatusFormSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  cancellationReason: optionalText(
    500,
    'Lý do hủy không được vượt quá 500 ký tự.',
  ),
})

export type UpdateBookingStatusFormValues = z.infer<
  typeof updateBookingStatusFormSchema
>

export const managementBookingFilterSchema = z.object({
  search: z.string().trim().max(160, 'Từ khóa quá dài.'),
  status: z.union([z.literal(''), z.enum(BOOKING_STATUSES)]),
  customerId: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[1-9][0-9]*$/.test(value),
      'Mã khách hàng không hợp lệ.',
    ),
  roomId: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[1-9][0-9]*$/.test(value),
      'Mã phòng không hợp lệ.',
    ),
})

export type ManagementBookingFilterValues = z.infer<
  typeof managementBookingFilterSchema
>
