import { z } from 'zod'

const compactVietnamesePhone = (value: string) =>
  value.trim().replace(/[().\-\s]/g, '')

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập họ và tên.')
  .max(120, 'Họ và tên không được vượt quá 120 ký tự.')

export const emailSchema = z
  .string()
  .trim()
  .max(160, 'Email không được vượt quá 160 ký tự.')
  .email('Email không hợp lệ.')

export const optionalEmailSchema = z.union([z.literal(''), emailSchema])

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập số điện thoại.')
  .refine(
    (value) => /^(?:\+84|84|0)[35789][0-9]{8}$/.test(compactVietnamesePhone(value)),
    'Số điện thoại Việt Nam không hợp lệ.',
  )

export const optionalPhoneSchema = z.union([z.literal(''), phoneSchema])

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
  .max(72, 'Mật khẩu không được vượt quá 72 ký tự.')
  .refine((value) => value.trim().length > 0, 'Mật khẩu không hợp lệ.')

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại.'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.')
    .refine((value) => value.trim().length > 0, 'Mật khẩu không hợp lệ.'),
  remember: z.boolean(),
})

export const registerSchema = z
  .object({
    confirmPassword: z.string(),
    email: optionalEmailSchema,
    fullName: fullNameSchema,
    password: passwordSchema,
    phone: phoneSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
