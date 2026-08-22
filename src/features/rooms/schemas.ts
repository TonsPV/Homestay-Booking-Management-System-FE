import { z } from 'zod'

import { compareDecimalStrings } from '@/shared/validation/decimal'

import { ROOM_STATUSES } from './types'
import {
  ROOM_IMAGE_ACCEPTED_TYPES,
  ROOM_IMAGE_MAX_FILE_SIZE,
} from './room-image-files'

export {
  ROOM_IMAGE_ACCEPT,
  ROOM_IMAGE_ACCEPTED_TYPES,
  ROOM_IMAGE_MAX_COUNT,
  ROOM_IMAGE_MAX_FILE_SIZE,
} from './room-image-files'

const requiredRoomTypeId = z
  .string()
  .regex(/^[1-9][0-9]*$/, 'Vui lòng chọn loại phòng.')

const requiredRoomNumber = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số phòng.')
  .max(50, 'Số phòng không được vượt quá 50 ký tự.')

const requiredRoomName = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập tên phòng.')
  .max(120, 'Tên phòng không được vượt quá 120 ký tự.')

const optionalDescription = z
  .string()
  .trim()
  .max(10_000, 'Mô tả không được vượt quá 10.000 ký tự.')

export const roomStatusSchema = z.enum(ROOM_STATUSES)

export const roomFormSchema = z.object({
  description: optionalDescription,
  name: requiredRoomName,
  roomNumber: requiredRoomNumber,
  roomTypeId: requiredRoomTypeId,
  status: roomStatusSchema,
})

export type RoomFormValues = z.infer<typeof roomFormSchema>

const dateOnlyInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(`${value}T00:00:00.000Z`)

    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() + 1 === month &&
      parsed.getUTCDate() === day
    )
  }, 'Ngày không hợp lệ.')

const roomCalendarRangeShape = {
  from: dateOnlyInput,
  to: dateOnlyInput,
}

function validateRoomCalendarRange(
  value: { from: string; to: string },
  context: z.RefinementCtx,
) {
  if (value.from >= value.to) {
    context.addIssue({
      code: 'custom',
      message: 'Ngày kết thúc phải sau ngày bắt đầu.',
      path: ['to'],
    })
    return
  }

  const rangeDays =
    (Date.parse(`${value.to}T00:00:00.000Z`) -
      Date.parse(`${value.from}T00:00:00.000Z`)) /
    (24 * 60 * 60 * 1000)

  if (rangeDays > 366) {
    context.addIssue({
      code: 'custom',
      message: 'Khoảng ngày không được vượt quá 366 ngày.',
      path: ['to'],
    })
  }
}

export const roomCalendarRangeFormSchema = z
  .object(roomCalendarRangeShape)
  .superRefine(validateRoomCalendarRange)

export const roomBlockFormSchema = z
  .object({
    ...roomCalendarRangeShape,
    reason: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập lý do khóa phòng.')
      .max(500, 'Lý do không được vượt quá 500 ký tự.'),
  })
  .superRefine(validateRoomCalendarRange)

export type RoomCalendarRangeFormValues = z.infer<
  typeof roomCalendarRangeFormSchema
>
export type RoomBlockFormValues = z.infer<typeof roomBlockFormSchema>

const positiveGuests = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]*$/, 'Số khách phải là số nguyên dương.')
  .refine(
    (value) => Number(value) <= 2_147_483_647,
    'Số khách vượt quá giới hạn cho phép.',
  )

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === '' ||
      /^(0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(value),
    'Giá phải là số không âm và có tối đa 2 chữ số thập phân.',
  )

export const roomSearchFormSchema = z
  .object({
    amenityIds: z
      .array(
        z.string().regex(/^[1-9][0-9]*$/, 'Tiện nghi không hợp lệ.'),
      )
      .max(20, 'Chỉ được chọn tối đa 20 tiện nghi.'),
    checkIn: dateOnlyInput,
    checkOut: dateOnlyInput,
    guests: positiveGuests,
    maxPrice: optionalMoney,
    minPrice: optionalMoney,
    roomTypeId: z
      .string()
      .refine(
        (value) => value === '' || /^[1-9][0-9]*$/.test(value),
        'Loại phòng không hợp lệ.',
      ),
  })
  .superRefine((value, context) => {
    if (value.checkIn >= value.checkOut) {
      context.addIssue({
        code: 'custom',
        message: 'Ngày trả phòng phải sau ngày nhận phòng.',
        path: ['checkOut'],
      })
    }

    if (
      value.minPrice !== '' &&
      value.maxPrice !== '' &&
      compareDecimalStrings(value.minPrice, value.maxPrice) > 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.',
        path: ['maxPrice'],
      })
    }
  })

export type RoomSearchFormValues = z.infer<typeof roomSearchFormSchema>

export const roomImageFormSchema = z.object({
  file: z
    .instanceof(File, { error: 'Vui lòng chọn một ảnh từ máy.' })
    .refine(
      (file) =>
        ROOM_IMAGE_ACCEPTED_TYPES.some((type) => type === file.type),
      'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.',
    )
    .refine(
      (file) => file.size <= ROOM_IMAGE_MAX_FILE_SIZE,
      'Dung lượng ảnh không được vượt quá 8 MiB.',
    ),
  isCover: z.boolean(),
  sortOrder: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, 'Thứ tự phải là số nguyên không âm.')
    .refine(
      (value) => Number(value) <= 2_147_483_647,
      'Thứ tự vượt quá giới hạn cho phép.',
    ),
})

export type RoomImageFormValues = z.infer<typeof roomImageFormSchema>
