import { z } from 'zod'

import {
  emailSchema,
  fullNameSchema,
  optionalPhoneSchema,
  passwordSchema,
} from '@/auth/validation'

export const createUserSchema = z
  .object({
    confirmPassword: z.string(),
    email: emailSchema,
    fullName: fullNameSchema,
    password: passwordSchema,
    phone: optionalPhoneSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export const updateUserSchema = z.object({
  email: emailSchema,
  fullName: fullNameSchema,
  password: z.union([z.literal(''), passwordSchema]),
  phone: optionalPhoneSchema,
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
