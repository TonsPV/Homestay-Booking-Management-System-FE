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

export const BED_TYPES = [
  "SINGLE",
  "DOUBLE",
  "QUEEN",
  "KING",
  "BUNK",
  "SOFA_BED",
] as const;

const bedConfigurationSchema = z.object({
  type: z.enum(BED_TYPES),
  quantity: z
    .number()
    .int("Số lượng giường phải là số nguyên.")
    .min(1, "Số lượng giường tối thiểu là 1.")
    .max(20, "Số lượng giường tối đa là 20."),
});

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
  beds: z
    .array(bedConfigurationSchema)
    .max(6, "Chỉ được thêm tối đa 6 loại giường.")
    .superRefine((beds, context) => {
      const seen = new Set<string>();

      beds.forEach((bed, index) => {
        if (seen.has(bed.type)) {
          context.addIssue({
            code: "custom",
            message: "Loại giường không được trùng.",
            path: [index, "type"],
          });
        }
        seen.add(bed.type);
      });
    }),
  description: optionalDescription,
  maxGuests: positiveGuestCount,
  name: requiredName,
});

export type RoomTypeFormValues = z.infer<typeof roomTypeFormSchema>;
