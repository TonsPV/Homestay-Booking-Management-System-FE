import { z } from 'zod'

export const amenityFormSchema = z.object({
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả không được vượt quá 500 ký tự.'),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên tiện nghi.')
    .max(120, 'Tên tiện nghi không được vượt quá 120 ký tự.'),
})

export type AmenityFormValues = z.infer<typeof amenityFormSchema>
