import { z } from 'zod'

import {
  fullNameSchema,
  optionalEmailSchema,
  phoneSchema,
  passwordSchema,
} from '@/auth/validation'

export const customerProfileSchema = z.object({
  email: optionalEmailSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
})

export type CustomerProfileFormValues = z.infer<
  typeof customerProfileSchema
>

export const customerPasswordSchema = z
  .object({
    confirmPassword: z.string(),
    currentPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu hiện tại.')
      .refine(
        (value) => value.trim().length > 0,
        'Mật khẩu hiện tại không hợp lệ.',
      ),
    newPassword: passwordSchema,
  })
  .superRefine((value, context) => {
    if (value.newPassword === value.currentPassword) {
      context.addIssue({
        code: 'custom',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
        path: ['newPassword'],
      })
    }

    if (value.confirmPassword !== value.newPassword) {
      context.addIssue({
        code: 'custom',
        message: 'Mật khẩu xác nhận không khớp.',
        path: ['confirmPassword'],
      })
    }
  })

export type CustomerPasswordFormValues = z.infer<
  typeof customerPasswordSchema
>

export const initialCustomerPasswordSchema = z
  .object({
    confirmPassword: z.string(),
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type InitialCustomerPasswordFormValues = z.infer<
  typeof initialCustomerPasswordSchema
>
