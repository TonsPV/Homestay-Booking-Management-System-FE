import { ArrowRight, BedDouble, Check, Users } from "lucide-react";

import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { formatBedConfiguration } from "@/shared/formatting/bed-configuration";
import { formatMoney } from "@/shared/formatting/formatters";

import { resolveRoomImageUrl } from "../image-url";
import type { PublicRoom } from "../types";
import { RoomImage } from "./RoomImage";

interface SearchRoomCardProps {
  available?: boolean;
  bookLabel?: string;
  onBook?: (room: PublicRoom) => void;
  onView?: (roomId: string) => void;
  room: PublicRoom;
}

export function SearchRoomCard({
  available = false,
  bookLabel = "Tiếp tục đặt phòng",
  onBook,
  onView,
  room,
}: SearchRoomCardProps) {
  const cover = room.images.find((image) => image.isCover) ?? room.images[0];
  const amenities = room.roomType.amenities.slice(0, 4);
  const description = room.description ?? room.roomType.description;

  return (
    <article className="group grid min-w-0 overflow-hidden rounded-panel bg-surface shadow-elevation-2 transition duration-base ease-calm hover:-translate-y-0.5 hover:shadow-elevation-3 motion-reduce:transform-none motion-reduce:transition-none md:grid-cols-[minmax(15rem,38%)_minmax(0,1fr)]">
      <div className="relative min-h-56 overflow-hidden bg-surface-muted md:min-h-full">
        {cover ? (
          <RoomImage
            alt={`Ảnh ${room.name}`}
            className="absolute inset-0 size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.03] motion-reduce:transition-none"
            decoding="async"
            fallbackLabel="Không thể tải ảnh phòng"
            loading="lazy"
            src={resolveRoomImageUrl(cover.imageUrl)}
          />
        ) : (
          <div className="grid size-full min-h-56 place-items-center text-sm font-semibold text-muted">
            Chưa có ảnh
          </div>
        )}
        {available ? (
          <Badge
            className="absolute left-3 top-3 shadow-elevation-1"
            tone="emerald"
          >
            <Check aria-hidden="true" className="size-3.5" />
            Còn phòng
          </Badge>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-strong">
              {room.roomType.name}
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight tracking-tight text-ink">
              {room.name}
            </h2>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xl font-black tracking-tight text-ink">
              {formatMoney(room.roomType.basePrice)}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">
              Giá cơ sở / đêm
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted">
          <Users aria-hidden="true" className="size-4" />
          Tối đa {room.roomType.maxGuests} khách
        </div>

        {formatBedConfiguration(room.roomType.beds, room.roomType.bedType) ? (
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
            <BedDouble aria-hidden="true" className="size-4" />
            {formatBedConfiguration(room.roomType.beds, room.roomType.bedType)}
          </div>
        ) : null}

        {description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}

        {amenities.length > 0 ? (
          <ul
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Tiện nghi nổi bật"
          >
            {amenities.map((amenity) => (
              <li
                className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink"
                key={amenity.id}
              >
                {amenity.name}
              </li>
            ))}
            {room.roomType.amenities.length > amenities.length ? (
              <li className="px-1 py-1.5 text-xs font-bold text-muted">
                +{room.roomType.amenities.length - amenities.length}
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          {onView ? (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-bold text-ink hover:text-brand-strong focus-visible:outline-brand"
              onClick={() => onView(room.id)}
              type="button"
            >
              Xem chi tiết
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <span />
          )}
          {onBook ? (
            <Button onClick={() => onBook(room)}>{bookLabel}</Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
