import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import { formatBedConfiguration } from "@/shared/formatting/bed-configuration";
import { formatMoney, formatNumber } from "@/shared/formatting/formatters";

import { resolveRoomImageUrl } from "../image-url";
import type { PublicRoom } from "../types";
import { RoomImage } from "./RoomImage";

interface RoomCardProps {
  onView?: (roomId: string) => void;
  room: PublicRoom;
}

function getCoverImage(room: PublicRoom) {
  return room.images.find((image) => image.isCover) ?? room.images[0];
}

export function RoomCard({ onView, room }: RoomCardProps) {
  const cover = getCoverImage(room);

  return (
    <Card className="group flex h-full min-w-0 flex-col overflow-hidden border-line p-0 shadow-card transition duration-base ease-calm hover:-translate-y-1 hover:border-brand/30 hover:shadow-elevation-3 motion-reduce:transform-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted sm:aspect-[16/10]">
        {cover ? (
          <RoomImage
            alt={`Ảnh ${room.name}`}
            className="size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            decoding="async"
            fallbackLabel="Không thể tải ảnh phòng"
            loading="lazy"
            src={resolveRoomImageUrl(cover.imageUrl)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm font-semibold text-muted">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="min-w-0">
          <Badge tone="blue">{room.roomType.name}</Badge>
          <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-ink">
            {room.name}
          </h2>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {room.description ??
            room.roomType.description ??
            "Không gian nghỉ dưỡng tiện nghi và thoải mái."}
        </p>

        {formatBedConfiguration(room.roomType.beds, room.roomType.bedType) ? (
          <p className="mt-3 text-sm font-semibold text-muted">
            Giường:{" "}
            {formatBedConfiguration(room.roomType.beds, room.roomType.bedType)}
          </p>
        ) : null}

        {room.roomType.amenities.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {room.roomType.amenities.slice(0, 4).map((amenity) => (
              <Badge key={amenity.id}>{amenity.name}</Badge>
            ))}
            {room.roomType.amenities.length > 4 ? (
              <span className="text-xs font-bold text-muted">
                +{room.roomType.amenities.length - 4}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto grid gap-4 pt-6">
          <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="rounded-card bg-surface-muted px-3 py-2">
              <p className="text-xs font-bold text-muted">Sức chứa</p>
              <p className="mt-0.5 text-sm font-black text-ink">
                Tối đa {formatNumber(room.roomType.maxGuests)} khách
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-xs font-bold text-muted">Giá từ</p>
              <p className="mt-1 text-xl font-black leading-none text-brand">
                {formatMoney(room.roomType.basePrice)}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">mỗi đêm</p>
            </div>
          </div>
          {onView ? (
            <Button
              className="min-h-11 w-full"
              onClick={() => onView(room.id)}
              variant="outline"
            >
              Xem chi tiết
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
