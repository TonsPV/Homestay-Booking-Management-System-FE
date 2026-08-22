import { ArrowUpRight, BedDouble, Users } from "lucide-react";

import { RoomImage } from "@/features/rooms/components/RoomImage";
import { resolveRoomImageUrl } from "@/features/rooms/image-url";
import type { PublicRoom } from "@/features/rooms/types";
import { EmptyState, ErrorState } from "@/shared/components/Feedback";
import { LinkButton } from "@/shared/components/LinkButton";
import { formatBedConfiguration } from "@/shared/formatting/bed-configuration";
import { formatMoney } from "@/shared/formatting/formatters";

import { FadeIn } from "./FadeIn";

const FEATURED_LIMIT = 3;
const FEATURED_ROOM_IMAGES = [
  "/images/home/hero.webp",
  "/images/home/experience.webp",
  "/images/home/closing.webp",
] as const;

interface FeaturedRoomsSectionProps {
  isError: boolean;
  isPending: boolean;
  refetch: () => void;
  rooms: PublicRoom[];
}

function illustrativeImageForRoom(roomId: string) {
  const hash = [...roomId].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return FEATURED_ROOM_IMAGES[hash % FEATURED_ROOM_IMAGES.length];
}

function HospitalityRoomCard({
  featured,
  room,
}: {
  featured?: boolean;
  room: PublicRoom;
}) {
  const amenities = room.roomType.amenities.slice(0, featured ? 4 : 2);
  const cover = room.images.find((image) => image.isCover) ?? room.images[0];
  const isIllustrative = !cover;
  const imageSrc = cover
    ? resolveRoomImageUrl(cover.imageUrl)
    : illustrativeImageForRoom(room.id);

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-card bg-surface shadow-elevation-2 transition duration-base ease-calm hover:-translate-y-1 hover:shadow-elevation-4 motion-reduce:transform-none motion-reduce:transition-none">
      <div
        className={`relative overflow-hidden bg-surface-muted ${featured ? "min-h-72 flex-1" : "aspect-[16/9]"}`}
      >
        <RoomImage
          alt={
            isIllustrative
              ? `Ảnh minh họa cho ${room.name}`
              : `Không gian ${room.name}`
          }
          className="absolute inset-0 size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.035] motion-reduce:transition-none"
          loading="lazy"
          src={imageSrc}
        />
        <span className="absolute left-4 top-4 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white shadow-elevation-1">
          Có thể kiểm tra lịch
        </span>
        {isIllustrative ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-inverse/70 px-2.5 py-1 text-[0.6875rem] font-semibold text-white backdrop-blur-sm">
            Ảnh minh họa
          </span>
        ) : null}
      </div>

      <div className={`flex flex-col ${featured ? "p-6 sm:p-7" : "p-5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-brand-strong">
              {room.roomType.name}
            </p>
            <h3
              className={`mt-1 font-black leading-tight text-ink ${featured ? "text-2xl" : "text-xl"}`}
            >
              {room.name}
            </h3>
          </div>
          <p className="shrink-0 text-right text-lg font-black text-ink">
            {formatMoney(room.roomType.basePrice)}
            <span className="block text-xs font-semibold text-muted">
              mỗi đêm
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-2">
            <Users aria-hidden="true" className="size-4" />
            Tối đa {room.roomType.maxGuests} khách
          </span>
          {formatBedConfiguration(room.roomType.beds, room.roomType.bedType) ? (
            <span className="inline-flex items-center gap-2">
              <BedDouble aria-hidden="true" className="size-4" />
              {formatBedConfiguration(room.roomType.beds, room.roomType.bedType)}
            </span>
          ) : null}
        </div>

        {amenities.length ? (
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
          </ul>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <LinkButton
            className="px-2 shadow-none"
            to={`/rooms/${room.id}`}
            variant="outline"
          >
            Xem chi tiết{" "}
            <ArrowUpRight aria-hidden="true" className="ml-1 size-4" />
          </LinkButton>
          <LinkButton to={`/rooms/search?roomTypeId=${room.roomTypeId}`}>
            Kiểm tra phòng
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

function RoomCardsSkeleton() {
  return (
    <div
      aria-label="Đang tải phòng nổi bật"
      className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]"
      data-testid="featured-rooms-loading"
      role="status"
    >
      {[0, 1, 2].map((item) => (
        <div
          className={`${item === 0 ? "lg:row-span-2" : ""} min-h-64 animate-pulse rounded-card bg-surface shadow-elevation-1`}
          key={item}
        />
      ))}
    </div>
  );
}

export function FeaturedRoomsSection({
  isError,
  isPending,
  refetch,
  rooms,
}: FeaturedRoomsSectionProps) {
  const featuredRooms = rooms.slice(0, FEATURED_LIMIT);

  return (
    <section
      aria-labelledby="home-featured-heading"
      className="mx-auto w-full max-w-app px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8"
    >
      <FadeIn className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand-strong">
            Không gian đang mở đón khách
          </p>
          <h2
            className="mt-2 max-w-xl text-3xl font-black leading-tight tracking-[-0.025em] text-ink sm:text-4xl"
            id="home-featured-heading"
          >
            Chọn một căn phòng hợp với nhịp nghỉ của bạn.
          </h2>
        </div>
        <LinkButton to="/rooms" variant="outline">
          Xem tất cả phòng
        </LinkButton>
      </FadeIn>

      {isPending ? <RoomCardsSkeleton /> : null}
      {isError ? (
        <div data-testid="featured-rooms-error">
          <ErrorState
            description="Không thể tải danh sách phòng. Vui lòng thử lại."
            onRetry={() => void refetch()}
          />
        </div>
      ) : null}
      {!isPending && !isError && featuredRooms.length === 0 ? (
        <div data-testid="featured-rooms-empty">
          <EmptyState
            description="Hiện chưa có phòng được mở bán. Vui lòng quay lại sau."
            title="Chưa có phòng"
          />
        </div>
      ) : null}
      {!isPending && !isError && featuredRooms.length > 0 ? (
        <div className="grid auto-rows-fr gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          {featuredRooms.map((room, index) => (
            <FadeIn
              className={index === 0 ? "lg:row-span-2" : ""}
              delay={Math.min(index, 2) * 0.08}
              key={room.id}
            >
              <HospitalityRoomCard featured={index === 0} room={room} />
            </FadeIn>
          ))}
        </div>
      ) : null}
    </section>
  );
}
