import { z } from 'zod'

import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from './types'

export const createVnPayFormSchema = z.object({
  bankCode: z.union([
    z.literal(''),
    z.enum(['VNPAYQR', 'VNBANK', 'INTCARD']),
  ]),
  locale: z.enum(['vn', 'en']),
})

export type CreateVnPayFormValues = z.infer<
  typeof createVnPayFormSchema
>

export const createManualPaymentFormSchema = z.object({
  method: z.enum(['CASH', 'BANK_TRANSFER']),
})

export type CreateManualPaymentFormValues = z.infer<
  typeof createManualPaymentFormSchema
>

export const refundPaymentFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Lý do hoàn tiền không được vượt quá 500 ký tự.'),
})

export type RefundPaymentFormValues = z.infer<
  typeof refundPaymentFormSchema
>

export const paymentFilterSchema = z.object({
  method: z.union([z.literal(''), z.enum(PAYMENT_METHODS)]),
  status: z.union([z.literal(''), z.enum(PAYMENT_STATUSES)]),
})

export type PaymentFilterValues = z.infer<typeof paymentFilterSchema>

