import { useEffect, useRef, useState, type FormEvent } from "react";

import { getErrorMessage } from "@/api/errors";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { Alert, ErrorState, LoadingState } from "@/shared/components/Feedback";
import { Field, Input } from "@/shared/components/FormControls";

import {
  useCreateRoomImage,
  useDeleteRoomImage,
  useManagementRoom,
  useSetRoomCoverImage,
} from "../hooks";
import { resolveRoomImageUrl } from "../image-url";
import {
  ROOM_IMAGE_ACCEPT,
  roomImageFormSchema,
  type RoomImageFormValues,
} from "../schemas";
import { formatFileSize } from "../room-image-files";
import { RoomImage } from "./RoomImage";

interface RoomImageManagerProps {
  roomId: string;
}

type FormErrors = Partial<Record<keyof RoomImageFormValues, string>>;

export function RoomImageManager({ roomId }: RoomImageManagerProps) {
  const roomQuery = useManagementRoom(roomId);
  const createMutation = useCreateRoomImage();
  const deleteMutation = useDeleteRoomImage();
  const coverMutation = useSetRoomCoverImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [sortOrder, setSortOrder] = useState("0");
  const [isCover, setIsCover] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>();
  const actionError =
    createMutation.error ?? deleteMutation.error ?? coverMutation.error;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function resetUploadForm() {
    setFile(undefined);
    setSortOrder("0");
    setIsCover(false);
    setFormErrors({});

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = roomImageFormSchema.safeParse({
      file,
      isCover,
      sortOrder,
    });

    if (!result.success) {
      const errors: FormErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (
          (field === "file" || field === "isCover" || field === "sortOrder") &&
          !errors[field]
        ) {
          errors[field] = issue.message;
        }
      }

      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSuccessMessage(undefined);

    try {
      await createMutation.mutateAsync({
        input: {
          file: result.data.file,
          isCover: result.data.isCover,
          sortOrder: Number(result.data.sortOrder),
        },
        roomId,
      });
      resetUploadForm();
      setSuccessMessage("Đã tải ảnh lên phòng.");
    } catch {
      // Mutation state renders the API error without clearing the selection.
    }
  }

  if (roomQuery.isPending) {
    return <LoadingState label="Đang tải thư viện ảnh…" />;
  }

  if (roomQuery.isError) {
    return (
      <ErrorState
        description={getErrorMessage(roomQuery.error)}
        onRetry={() => void roomQuery.refetch()}
      />
    );
  }

  const room = roomQuery.data;

  return (
    <Card>
      <div>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Ảnh phòng {room.roomNumber}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Chọn ảnh JPEG, PNG hoặc WebP từ máy. Ảnh đầu tiên sẽ tự động được
            đặt làm ảnh bìa.
          </p>
        </div>
      </div>

      {actionError ? (
        <Alert className="mt-5" tone="error">
          {getErrorMessage(actionError)}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert className="mt-5" tone="success">
          {successMessage}
        </Alert>
      ) : null}

      <form
        className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_8rem_auto_auto] lg:items-end"
        noValidate
        onSubmit={submitImage}
      >
        <Field
          error={formErrors.file}
          hint="Tối đa 8 MiB. Máy chủ sẽ kiểm tra và tối ưu ảnh trước khi lưu."
          label="Tệp ảnh"
          required
        >
          <Input
            accept={ROOM_IMAGE_ACCEPT}
            disabled={createMutation.isPending}
            onChange={(event) => {
              setFile(event.target.files?.[0]);
              setFormErrors((current) => ({
                ...current,
                file: undefined,
              }));
            }}
            ref={fileInputRef}
            type="file"
          />
        </Field>
        <Field error={formErrors.sortOrder} label="Thứ tự">
          <Input
            disabled={createMutation.isPending}
            min={0}
            onChange={(event) => {
              setSortOrder(event.target.value);
              setFormErrors((current) => ({
                ...current,
                sortOrder: undefined,
              }));
            }}
            step={1}
            type="number"
            value={sortOrder}
          />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            checked={isCover}
            className="size-4 accent-blue-600"
            disabled={createMutation.isPending}
            onChange={(event) => setIsCover(event.target.checked)}
            type="checkbox"
          />
          Đặt làm ảnh bìa
        </label>
        <Button loading={createMutation.isPending} type="submit">
          Tải ảnh lên
        </Button>

        {file && previewUrl ? (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center lg:col-span-4">
            <RoomImage
              alt="Xem trước ảnh đã chọn"
              className="aspect-[4/3] w-28 rounded-lg object-cover"
              fallbackLabel="Không thể xem trước"
              src={previewUrl}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(file.size)} · {file.type}
              </p>
            </div>
            <Button
              disabled={createMutation.isPending}
              onClick={resetUploadForm}
              variant="text"
            >
              Chọn lại
            </Button>
          </div>
        ) : null}
      </form>

      {room.images.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Phòng chưa có ảnh.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {room.images.map((image) => (
            <article
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              key={image.id}
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <RoomImage
                  alt={`Ảnh phòng ${room.roomNumber}`}
                  className="size-full object-cover"
                  fallbackLabel="Không thể tải ảnh"
                  loading="lazy"
                  src={resolveRoomImageUrl(image.imageUrl)}
                />
                {image.isCover ? (
                  <Badge className="absolute left-3 top-3" tone="blue">
                    Ảnh bìa
                  </Badge>
                ) : null}
              </div>
              <div className="p-3">
                <p className="text-xs text-slate-500">
                  Thứ tự: {image.sortOrder}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!image.isCover ? (
                    <Button
                      className="flex-1"
                      loading={
                        coverMutation.isPending &&
                        coverMutation.variables === image.id
                      }
                      onClick={() => {
                        setSuccessMessage(undefined);
                        coverMutation.mutate(image.id, {
                          onSuccess: () =>
                            setSuccessMessage("Đã đặt ảnh bìa mới."),
                        });
                      }}
                      variant="outline"
                    >
                      Đặt làm bìa
                    </Button>
                  ) : null}
                  <Button
                    className="flex-1"
                    loading={
                      deleteMutation.isPending &&
                      deleteMutation.variables === image.id
                    }
                    onClick={() => {
                      if (window.confirm("Xóa ảnh này khỏi phòng?")) {
                        setSuccessMessage(undefined);
                        deleteMutation.mutate(image.id, {
                          onSuccess: () =>
                            setSuccessMessage("Đã xóa ảnh khỏi phòng."),
                        });
                      }
                    }}
                    variant="danger"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
