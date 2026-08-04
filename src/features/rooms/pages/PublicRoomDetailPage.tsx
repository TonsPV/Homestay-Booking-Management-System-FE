import { useEffect, useState } from "react";

import { getErrorMessage } from "@/api/errors";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { ErrorState, LoadingState } from "@/shared/components/Feedback";
import { formatMoney, formatNumber } from "@/shared/formatting/formatters";

import { useRoom } from "../hooks";
import { resolveRoomImageUrl } from "../image-url";
import { RoomImage } from "../components/RoomImage";
import type { PublicRoom } from "../types";

interface PublicRoomDetailPageProps {
  onBack?: () => void;
  onBook?: (room: PublicRoom) => void;
  roomId: string;
}

export function PublicRoomDetailPage({
  onBack,
  onBook,
  roomId,
}: PublicRoomDetailPageProps) {
  const query = useRoom(roomId);
  const [selectedImageId, setSelectedImageId] = useState<string>();

  useEffect(() => {
    setSelectedImageId(undefined);
  }, [roomId]);

  if (query.isPending) {
    return <LoadingState label="Đang tải thông tin phòng…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const room = query.data;
  const selectedImage =
    room.images.find((image) => image.id === selectedImageId) ??
    room.images.find((image) => image.isCover) ??
    room.images[0];
  const selectedImageIndex = selectedImage
    ? room.images.findIndex((image) => image.id === selectedImage.id)
    : -1;

  return (
    <div className="grid min-w-0 gap-6">
      {onBack ? (
        <div>
          <Button className="min-h-11" onClick={onBack} variant="text">
            ← Quay lại danh sách
          </Button>
        </div>
      ) : null}

      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
        <div className="grid min-w-0 gap-6">
          <section
            aria-labelledby="room-gallery-heading"
            className="animate-soft-scale grid min-w-0 gap-3"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">
                  Không gian lưu trú
                </p>
                <h2
                  className="mt-1 text-xl font-black text-ink"
                  id="room-gallery-heading"
                >
                  Hình ảnh phòng
                </h2>
              </div>
              {selectedImageIndex >= 0 ? (
                <p className="text-sm font-semibold text-muted">
                  {selectedImageIndex + 1} / {room.images.length}
                </p>
              ) : null}
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-panel border border-line bg-surface-muted shadow-elevation-3 sm:aspect-[16/10]">
              {selectedImage ? (
                <RoomImage
                  alt={`Ảnh ${room.name}`}
                  className="size-full object-cover transition duration-slow ease-calm hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
                  decoding="async"
                  fallbackLabel="Không thể tải ảnh phòng"
                  src={resolveRoomImageUrl(selectedImage.imageUrl)}
                />
              ) : (
                <div className="flex size-full items-center justify-center font-semibold text-muted">
                  Phòng chưa có ảnh
                </div>
              )}
            </div>
            {room.images.length > 1 ? (
              <div
                aria-label="Chọn ảnh phòng"
                className="grid grid-cols-4 gap-3 sm:grid-cols-6"
                role="group"
              >
                {room.images.map((image, index) => (
                  <button
                    aria-label={`Xem ảnh ${index + 1} của ${room.name}`}
                    aria-pressed={selectedImage?.id === image.id}
                    className={`aspect-square min-h-11 overflow-hidden rounded-control border-2 bg-surface-muted transition duration-base ease-calm hover:-translate-y-0.5 ${
                      selectedImage?.id === image.id
                        ? "border-brand ring-2 ring-brand/15"
                        : "border-transparent hover:border-line"
                    }`}
                    key={image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    type="button"
                  >
                    <RoomImage
                      alt=""
                      className="size-full object-cover"
                      decoding="async"
                      fallbackLabel="Ảnh lỗi"
                      loading="lazy"
                      src={resolveRoomImageUrl(image.imageUrl)}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <Card className="border-line p-6 shadow-card sm:p-8">
            <h2 className="text-lg font-black text-ink">Về căn phòng này</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">
              {room.description ??
                room.roomType.description ??
                "Thông tin mô tả đang được cập nhật."}
            </p>
            {room.roomType.amenities.length > 0 ? (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-sm font-black text-ink">Tiện nghi</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.roomType.amenities.map((amenity) => (
                    <Badge key={amenity.id} tone="blue">
                      {amenity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="animate-soft-rise min-w-0 lg:sticky lg:top-24">
          <Card className="border-line p-6 shadow-elevation-4 sm:p-8">
            <Badge tone="blue">{room.roomType.name}</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
              {room.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted">
              Phòng {room.roomNumber}
            </p>

            <div className="mt-6 rounded-card bg-brand-soft px-4 py-5">
              <p className="text-xs font-bold text-brand">Giá từ</p>
              <p className="mt-2 text-3xl font-black leading-none text-brand">
                {formatMoney(room.roomType.basePrice)}
                <span className="ml-2 text-sm font-medium text-muted">
                  / đêm
                </span>
              </p>
            </div>

            <dl className="mt-5">
              <div className="rounded-card bg-surface-muted p-4">
                <dt className="text-xs font-bold text-muted">Sức chứa</dt>
                <dd className="mt-1 font-black text-ink">
                  {formatNumber(room.roomType.maxGuests)} khách
                </dd>
              </div>
            </dl>

            {onBook ? (
              <Button
                className="mt-7 min-h-12 w-full px-6"
                onClick={() => onBook(room)}
              >
                Chọn phòng này
              </Button>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
