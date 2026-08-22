import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { Alert } from "@/shared/components/Feedback";
import { Button } from "@/shared/components/Button";
import { Field, Input, Select, Textarea } from "@/shared/components/FormControls";
import { BED_TYPE_LABELS } from "@/shared/formatting/bed-configuration";

import {
  BED_TYPES,
  roomTypeFormSchema,
  type RoomTypeFormValues,
} from "../schemas";
import type { AdminRoomType, CreateRoomTypeInput } from "../types";

interface RoomTypeFormProps {
  initialValue?: AdminRoomType;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateRoomTypeInput) => Promise<void> | void;
}

const EMPTY_BED: RoomTypeFormValues["beds"][number] = {
  quantity: 1,
  type: "SINGLE",
};

export function RoomTypeForm({
  initialValue,
  loading = false,
  onCancel,
  onSubmit,
}: RoomTypeFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RoomTypeFormValues>({
    defaultValues: {
      basePrice: initialValue?.basePrice ?? "",
      beds: initialValue?.beds?.map((bed) => ({
        quantity: bed.quantity,
        type: bed.type,
      })) ?? [],
      description: initialValue?.description ?? "",
      maxGuests: initialValue ? String(initialValue.maxGuests) : "",
      name: initialValue?.name ?? "",
    },
    resolver: zodResolver(roomTypeFormSchema),
  });
  const { append, fields, remove } = useFieldArray({ control, name: "beds" });
  const legacyBedType =
    initialValue?.beds?.length === 0 ? initialValue.bedType?.trim() : undefined;

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          basePrice: values.basePrice,
          beds: values.beds,
          description: values.description || null,
          maxGuests: Number(values.maxGuests),
          name: values.name,
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.name?.message} label="Tên loại phòng" required>
          <Input
            autoComplete="off"
            maxLength={120}
            placeholder="Ví dụ: Phòng gia đình"
            {...register("name")}
          />
        </Field>
        <Field
          error={errors.maxGuests?.message}
          label="Số khách tối đa"
          required
        >
          <Input
            inputMode="numeric"
            min={1}
            step={1}
            type="number"
            {...register("maxGuests")}
          />
        </Field>
      </div>

      <Field
        error={errors.basePrice?.message}
        hint="Nhập số tiền theo VND, tối đa 2 chữ số thập phân."
        label="Giá cơ bản"
        required
      >
        <Input
          inputMode="decimal"
          min={0}
          placeholder="1250000"
          step="0.01"
          type="number"
          {...register("basePrice")}
        />
      </Field>

      <section aria-labelledby="room-type-beds-heading" className="grid gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink" id="room-type-beds-heading">
              Cấu hình giường
            </h3>
            <p className="mt-1 text-xs text-muted">
              Chọn loại giường và số lượng, không lưu nhãn tiếng Việt vào API.
            </p>
          </div>
          <Button
            disabled={fields.length >= BED_TYPES.length}
            onClick={() => append(EMPTY_BED)}
            type="button"
            variant="outline"
          >
            Thêm loại giường
          </Button>
        </div>

        {legacyBedType ? (
          <Alert tone="warning">
            Dữ liệu loại giường cũ: {legacyBedType}. Vui lòng cấu hình lại theo
            định dạng mới.
          </Alert>
        ) : null}

        {fields.length === 0 ? (
          <p className="rounded-card border border-dashed border-line px-4 py-3 text-sm text-muted">
            Chưa có cấu hình giường.
          </p>
        ) : (
          <div className="grid gap-3">
            {fields.map((field, index) => {
              const typeError = errors.beds?.[index]?.type?.message;
              const quantityError = errors.beds?.[index]?.quantity?.message;

              return (
                <div
                  className="grid gap-3 rounded-card border border-line bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end"
                  key={field.id}
                >
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Loại giường
                    <Select {...register(`beds.${index}.type`)}>
                      {BED_TYPES.map((bedType) => (
                        <option key={bedType} value={bedType}>
                          {BED_TYPE_LABELS[bedType]}
                        </option>
                      ))}
                    </Select>
                    {typeError ? (
                      <span className="text-sm font-normal text-danger" role="alert">
                        {typeError}
                      </span>
                    ) : null}
                  </label>

                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Số lượng
                    <Input
                      inputMode="numeric"
                      min={1}
                      max={20}
                      step={1}
                      type="number"
                      {...register(`beds.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {quantityError ? (
                      <span className="text-sm font-normal text-danger" role="alert">
                        {quantityError}
                      </span>
                    ) : null}
                  </label>

                  <Button onClick={() => remove(index)} type="button" variant="text">
                    Xóa
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {typeof errors.beds?.message === "string" ? (
          <span className="text-sm text-danger" role="alert">
            {errors.beds.message}
          </span>
        ) : null}
      </section>

      <Field error={errors.description?.message} label="Mô tả">
        <Textarea
          maxLength={10_000}
          placeholder="Mô tả tiện nghi và đặc điểm của loại phòng"
          {...register("description")}
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-3">
        <Button disabled={loading} onClick={onCancel} variant="outline">
          Hủy
        </Button>
        <Button loading={loading} type="submit">
          {initialValue ? "Lưu thay đổi" : "Tạo loại phòng"}
        </Button>
      </div>
    </form>
  );
}
