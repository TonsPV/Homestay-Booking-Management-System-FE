import { z } from "zod";

const requiredName = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập tên loại phòng.")
  .max(120, "Tên loại phòng không được vượt quá 120 ký tự.");

const optionalDescription = z
  .string()
  .trim()
  .max(10_000, "Mô tả không được vượt quá 10.000 ký tự.");

const optionalBedType = z
  .string()
  .trim()
  .max(120, "Loại giường không được vượt quá 120 ký tự.");

const positiveGuestCount = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]*$/, "Số khách phải là số nguyên dương.")
  .refine(
    (value) => Number(value) <= 2_147_483_647,
    "Số khách vượt quá giới hạn cho phép.",
  );

export const roomTypeMoneySchema = z
  .string()
  .trim()
  .regex(
    /^(0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/,
    "Giá phải là số không âm và có tối đa 2 chữ số thập phân.",
  );

export const roomTypeFormSchema = z.object({
  basePrice: roomTypeMoneySchema,
  bedType: optionalBedType,
  description: optionalDescription,
  maxGuests: positiveGuestCount,
  name: requiredName,
});

export type RoomTypeFormValues = z.infer<typeof roomTypeFormSchema>;
