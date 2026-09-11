import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Images,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getErrorMessage } from "@/api/errors";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { ErrorState, LoadingState } from "@/shared/components/Feedback";
import { formatBedConfiguration } from "@/shared/formatting/bed-configuration";
import { formatMoney, formatNumber } from "@/shared/formatting/formatters";

import { RoomAmenityList } from "../components/RoomAmenityList";
import { RoomGalleryViewer } from "../components/RoomGalleryViewer";
import { RoomImage } from "../components/RoomImage";
import { RoomStayPicker } from "../components/RoomStayPicker";
import {
  countStayNights,
  validateRoomStay,
  type RoomStay,
} from "../components/room-stay";
import { useRoom } from "../hooks";
import { resolveRoomImageUrl } from "../image-url";
import type { PublicRoom, RoomImage as RoomImageDto } from "../types";

interface PublicRoomDetailPageProps {
  initialStay?: RoomStay;
  onBack?: () => void;
  onBook?: (room: PublicRoom, stay: RoomStay) => void;
  onFindOtherRooms?: (stay: RoomStay) => void;
  /** Persists the stay (e.g. into the URL) whenever the guest edits it. */
  onStayChange?: (stay: RoomStay) => void;
  roomId: string;
}

interface GalleryImageButtonProps {
  className: string;
  image: RoomImageDto;
  index: number;
  onOpen: (index: number) => void;
  primary?: boolean;
  roomName: string;
}

const DESCRIPTION_PREVIEW_LENGTH = 520;

function buildShareUrl(roomId: string, stay: RoomStay | null) {
  const url = new URL(`/rooms/${roomId}`, window.location.origin);
  const validStay =
    stay && Object.keys(validateRoomStay(stay, Number.MAX_SAFE_INTEGER)).length === 0
      ? stay
      : null;

  if (validStay) {
    url.searchParams.set("checkIn", validStay.checkIn);
    url.searchParams.set("checkOut", validStay.checkOut);
    url.searchParams.set("guests", String(validStay.guests));
  }

  return url.toString();
}

function getOrderedImages(images: RoomImageDto[]) {
  return [...images].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1;
    }

    return left.sortOrder - right.sortOrder;
  });
}

function getMeaningfulText(value: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

function GalleryImageButton({
  className,
  image,
  index,
  onOpen,
  primary = false,
  roomName,
}: GalleryImageButtonProps) {
  return (
    <button
      aria-label={
        primary ? `Mở bộ xem ảnh ${roomName}` : `Mở ảnh ${index + 1} của ${roomName}`
      }
      className={`group relative min-h-0 overflow-hidden bg-surface-muted text-left focus-visible:z-10 ${className}`}
      onClick={() => onOpen(index)}
      type="button"
    >
      <RoomImage
        alt={primary ? `Ảnh ${roomName}` : ""}
        className="size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        decoding="async"
        fallbackLabel="Không thể tải ảnh phòng"
        loading={primary ? undefined : "lazy"}
        src={resolveRoomImageUrl(image.imageUrl)}
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(0deg,rgb(15_23_42/0.42),transparent)] opacity-0 transition duration-base ease-calm group-hover:opacity-100 motion-reduce:transition-none" />
    </button>
  );
}

export function PublicRoomDetailPage({
  initialStay,
  onBack,
  onBook,
  onFindOtherRooms,
  onStayChange,
  roomId,
}: PublicRoomDetailPageProps) {
  const query = useRoom(roomId);
  const [selectedImageId, setSelectedImageId] = useState<string>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [headerActionVisible, setHeaderActionVisible] = useState(false);
  const [showMobileAction, setShowMobileAction] = useState(false);
  const [stay, setStay] = useState<RoomStay>(
    initialStay ?? { checkIn: "", checkOut: "", guests: 1 },
  );
  const [shareFeedback, setShareFeedback] = useState<"copied" | "error">();
  const staySectionRef = useRef<HTMLElement>(null);
  const headerActionRef = useRef<HTMLDivElement>(null);
  const stayActionRef = useRef<HTMLDivElement>(null);
  const shareResetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setSelectedImageId(undefined);
    setViewerOpen(false);
    setDescriptionExpanded(false);
  }, [roomId]);

  useEffect(() => {
    if (initialStay) {
      setStay(initialStay);
    }
  }, [initialStay]);

  useEffect(() => {
    return () => {
      if (shareResetTimer.current !== undefined) {
        window.clearTimeout(shareResetTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!query.data || typeof IntersectionObserver === "undefined") {
      return;
    }

    const primaryAction = stayActionRef.current;
    const headerAction = headerActionRef.current;
    if (!primaryAction || !headerAction) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === primaryAction) {
            setShowMobileAction(!entry.isIntersecting);
          }
          if (entry.target === headerAction) {
            setHeaderActionVisible(entry.isIntersecting);
          }
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(primaryAction);
    observer.observe(headerAction);

    return () => observer.disconnect();
  }, [query.data, roomId]);

  const stayErrors = useMemo(
    () =>
      query.data
        ? validateRoomStay(stay, query.data.roomType.maxGuests)
        : {},
    [query.data, stay],
  );
  const stayReady = Object.keys(stayErrors).length === 0;
  const nights = countStayNights(stay);

  function focusStaySection() {
    staySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    staySectionRef.current?.focus();
  }

  async function handleShare(room: PublicRoom) {
    const shareUrl = buildShareUrl(roomId, stayReady ? stay : null);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: room.name, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("copied");
    } catch {
      setShareFeedback("error");
    }

    if (shareResetTimer.current !== undefined) {
      window.clearTimeout(shareResetTimer.current);
    }
    shareResetTimer.current = window.setTimeout(() => {
      setShareFeedback(undefined);
    }, 4000);
  }

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
  const orderedImages = getOrderedImages(room.images);
  const selectedImage =
    orderedImages.find((image) => image.id === selectedImageId) ?? orderedImages[0];
  const selectedImageIndex = selectedImage
    ? orderedImages.findIndex((image) => image.id === selectedImage.id)
    : -1;
  const galleryImages = selectedImage
    ? [
        selectedImage,
        ...orderedImages.filter((image) => image.id !== selectedImage.id),
      ].slice(0, 3)
    : [];
  const bedConfiguration = formatBedConfiguration(
    room.roomType.beds,
    room.roomType.bedType,
  );
  const roomDescription = getMeaningfulText(room.description);
  const roomTypeDescription = getMeaningfulText(room.roomType.description);
  const hasAdditionalTypeDescription =
    roomTypeDescription !== null && roomTypeDescription !== roomDescription;
  const descriptionIsLong =
    roomDescription !== null && roomDescription.length > DESCRIPTION_PREVIEW_LENGTH;
  const displayedDescription =
    roomDescription && descriptionIsLong && !descriptionExpanded
      ? `${roomDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`
      : roomDescription;
  const featuredAmenities = room.roomType.amenities.slice(0, 6);
  const navigationItems = [
    ["#room-overview", "Tổng quan"],
    ["#room-gallery", "Hình ảnh"],
    ["#room-sleeping", "Chỗ ngủ"],
    ...(room.roomType.amenities.length > 0
      ? [["#room-amenities", "Tiện nghi"]]
      : []),
    ["#room-stay", "Chọn kỳ lưu trú"],
  ] as const;

  function openViewer(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  function handlePrimaryAction() {
    if (!stayReady) {
      focusStaySection();
      return;
    }

    onBook?.(room, stay);
  }

  function handleStayChange(next: RoomStay) {
    setStay(next);
    onStayChange?.(next);
  }

  const primaryLabel = stayReady ? "Tiếp tục đặt phòng" : "Chọn ngày lưu trú";
  const selectedStaySummary =
    stayReady && nights !== null
      ? `${formatNumber(nights)} đêm · ${formatNumber(stay.guests)} khách`
      : "Chọn ngày và số khách phù hợp";

  return (
    <div className="grid min-w-0 gap-8 pb-16 lg:gap-10">
      {onBack ? (
        <div>
          <Button className="min-h-11 px-0" onClick={onBack} variant="text">
            ← Quay lại khám phá phòng
          </Button>
        </div>
      ) : null}

      <header className="grid min-w-0 gap-6" id="room-overview">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <Badge tone="blue">{room.roomType.name}</Badge>
            <h1 className="mt-3 max-w-4xl font-display text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-ink text-balance sm:text-4xl lg:text-5xl">
              {room.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-muted">
              <span className="inline-flex items-center gap-2">
                <Users aria-hidden="true" className="size-4 text-brand" />
                Tối đa {formatNumber(room.roomType.maxGuests)} khách
              </span>
              {bedConfiguration ? (
                <span className="inline-flex items-center gap-2">
                  <BedDouble aria-hidden="true" className="size-4 text-brand" />
                  {bedConfiguration}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button
              className="min-h-11"
              onClick={() => void handleShare(room)}
              variant="outline"
            >
              <Share2 aria-hidden="true" className="size-4" />
              Chia sẻ
            </Button>
            <div ref={headerActionRef}>
              <Button className="min-h-11 px-5" onClick={focusStaySection}>
                <CalendarDays aria-hidden="true" className="size-4" />
                Chọn ngày
              </Button>
            </div>
          </div>
        </div>

        {shareFeedback ? (
          <p
            aria-live="polite"
            className="text-sm font-semibold text-brand-strong"
            role="status"
          >
            {shareFeedback === "copied"
              ? "Đã sao chép liên kết"
              : "Không sao chép được. Vui lòng sao chép URL từ thanh địa chỉ."}
          </p>
        ) : null}
      </header>

      <nav
        aria-label="Điều hướng nhanh trong trang"
        className="-mx-4 overflow-x-auto border-y border-line px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <ul className="flex min-w-max items-center gap-5 sm:gap-7">
          {navigationItems.map(([target, label]) => (
            <li key={target}>
              <a
                className="inline-flex min-h-12 items-center border-b-2 border-transparent text-sm font-semibold text-muted transition duration-fast ease-calm hover:border-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href={target}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid min-w-0 items-start gap-9 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-10 lg:gap-12">
          <section
            aria-labelledby="room-gallery-heading"
            className="min-w-0 scroll-mt-24"
            id="room-gallery"
          >
            <h2 className="sr-only" id="room-gallery-heading">
              Hình ảnh phòng
            </h2>
            {galleryImages.length === 0 ? (
              <div className="grid aspect-[4/3] place-items-center rounded-hero border border-line bg-surface-muted px-6 text-center sm:aspect-[16/9]">
                <div>
                  <Images aria-hidden="true" className="mx-auto size-7 text-muted" />
                  <p className="mt-3 text-sm font-semibold text-muted">
                    Phòng chưa có ảnh để xem.
                  </p>
                </div>
              </div>
            ) : galleryImages.length === 1 ? (
              <div className="relative overflow-hidden rounded-hero shadow-elevation-3">
                <GalleryImageButton
                  className="aspect-[4/3] w-full sm:aspect-[16/9]"
                  image={galleryImages[0]!}
                  index={selectedImageIndex}
                  onOpen={openViewer}
                  primary
                  roomName={room.name}
                />
                <button
                  className="absolute bottom-4 left-4 inline-flex min-h-11 items-center gap-2 rounded-control bg-ink/85 px-4 text-sm font-semibold text-on-inverse transition duration-fast ease-calm hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => openViewer(selectedImageIndex)}
                  type="button"
                >
                  <Images aria-hidden="true" className="size-4" />
                  Xem ảnh
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-hero shadow-elevation-3">
                <div
                  className={`grid overflow-hidden bg-surface-muted ${
                    galleryImages.length === 2
                      ? "aspect-[4/3] grid-cols-[minmax(0,1.7fr)_minmax(8rem,1fr)] gap-1.5 sm:aspect-[16/9]"
                      : "h-[22rem] grid-cols-[minmax(0,1.7fr)_minmax(8rem,1fr)] grid-rows-2 gap-1.5 sm:h-[30rem]"
                  }`}
                >
                  <GalleryImageButton
                    className={galleryImages.length === 2 ? "" : "row-span-2"}
                    image={galleryImages[0]!}
                    index={selectedImageIndex}
                    onOpen={openViewer}
                    primary
                    roomName={room.name}
                  />
                  <GalleryImageButton
                    className=""
                    image={galleryImages[1]!}
                    index={orderedImages.findIndex(
                      (image) => image.id === galleryImages[1]!.id,
                    )}
                    onOpen={openViewer}
                    roomName={room.name}
                  />
                  {galleryImages[2] ? (
                    <GalleryImageButton
                      className=""
                      image={galleryImages[2]}
                      index={orderedImages.findIndex(
                        (image) => image.id === galleryImages[2]!.id,
                      )}
                      onOpen={openViewer}
                      roomName={room.name}
                    />
                  ) : null}
                </div>
                <button
                  className="absolute bottom-4 left-4 inline-flex min-h-11 items-center gap-2 rounded-control bg-ink/85 px-4 text-sm font-semibold text-on-inverse transition duration-fast ease-calm hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => openViewer(selectedImageIndex)}
                  type="button"
                >
                  <Images aria-hidden="true" className="size-4" />
                  Xem tất cả {formatNumber(orderedImages.length)} ảnh
                </button>
              </div>
            )}

            {orderedImages.length > 1 ? (
              <div
                aria-label="Chọn ảnh phòng"
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
                role="group"
              >
                {orderedImages.slice(0, 6).map((image, index) => (
                  <button
                    aria-label={`Chọn ảnh ${index + 1} của ${room.name}`}
                    aria-pressed={selectedImage?.id === image.id}
                    className={`aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-control border-2 bg-surface-muted transition duration-fast ease-calm sm:w-28 ${
                      selectedImage?.id === image.id
                        ? "border-brand shadow-elevation-1"
                        : "border-transparent hover:border-brand/35"
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
                {orderedImages.length > 6 ? (
                  <button
                    aria-label={`Xem toàn bộ ${orderedImages.length} ảnh của ${room.name}`}
                    className="grid aspect-[4/3] w-24 shrink-0 place-items-center rounded-control border border-line bg-surface-muted px-2 text-center text-sm font-bold text-ink transition duration-fast ease-calm hover:border-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-28"
                    onClick={() => openViewer(selectedImageIndex >= 0 ? selectedImageIndex : 0)}
                    type="button"
                  >
                    <span>
                      +{formatNumber(orderedImages.length - 6)}
                      <span className="mt-0.5 block text-xs font-semibold text-muted">ảnh</span>
                    </span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          {featuredAmenities.length > 0 ? (
            <section
              aria-labelledby="featured-amenities-heading"
              className="border-y border-line py-5 sm:py-6"
            >
              <h2 className="sr-only" id="featured-amenities-heading">
                Tiện nghi nổi bật
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 xl:grid-cols-6 xl:gap-x-3">
                {featuredAmenities.map((amenity) => (
                  <li className="flex min-w-0 items-center gap-2.5" key={amenity.id}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
                      <Check aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold text-ink">
                      {amenity.name}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section
            aria-labelledby="room-description-heading"
            className="grid min-w-0 gap-8 scroll-mt-24 xl:grid-cols-[minmax(0,1.4fr)_minmax(15rem,0.6fr)] xl:gap-12"
          >
            <div className="min-w-0">
              <h2
                className="font-display text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl"
                id="room-description-heading"
              >
                Về căn phòng này
              </h2>
              <div className="mt-4 max-w-[72ch] whitespace-pre-line text-base leading-7 text-muted sm:text-[1.0625rem] sm:leading-8">
                {displayedDescription ?? "Thông tin mô tả đang được cập nhật."}
              </div>
              {descriptionIsLong ? (
                <button
                  aria-expanded={descriptionExpanded}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                  type="button"
                >
                  {descriptionExpanded ? "Thu gọn mô tả" : "Đọc thêm về căn phòng"}
                  {descriptionExpanded ? (
                    <ChevronUp aria-hidden="true" className="size-4" />
                  ) : (
                    <ChevronDown aria-hidden="true" className="size-4" />
                  )}
                </button>
              ) : null}
            </div>

            <section
              aria-labelledby="room-sleeping-heading"
              className="border-t border-line pt-6 scroll-mt-24 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"
              id="room-sleeping"
            >
              <h2 className="text-lg font-bold text-ink" id="room-sleeping-heading">
                Không gian và chỗ ngủ
              </h2>
              <dl className="mt-5 grid gap-5">
                {bedConfiguration ? (
                  <div className="flex gap-3">
                    <BedDouble aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                    <div>
                      <dt className="text-sm font-semibold text-muted">Giường</dt>
                      <dd className="mt-1 text-base font-bold text-ink">
                        {bedConfiguration}
                      </dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Users aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <dt className="text-sm font-semibold text-muted">Sức chứa</dt>
                    <dd className="mt-1 text-base font-bold text-ink">
                      Tối đa {formatNumber(room.roomType.maxGuests)} khách
                    </dd>
                  </div>
                </div>
              </dl>
              {hasAdditionalTypeDescription ? (
                <p className="mt-6 text-sm leading-6 text-muted">
                  {roomTypeDescription}
                </p>
              ) : null}
            </section>
          </section>

          {room.roomType.amenities.length > 0 ? (
            <section
              aria-labelledby="room-amenities-heading"
              className="border-t border-line pt-9 scroll-mt-24 sm:pt-10"
              id="room-amenities"
            >
              <div className="max-w-2xl">
                <h2
                  className="font-display text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl"
                  id="room-amenities-heading"
                >
                  Tiện nghi dành cho kỳ nghỉ
                </h2>
                <p className="mt-2 text-base leading-7 text-muted">
                  Khám phá những tiện nghi được cung cấp cho loại phòng này.
                </p>
              </div>
              <div className="mt-6">
                <RoomAmenityList amenities={room.roomType.amenities} />
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="room-stay-heading"
            className="scroll-mt-24 rounded-hero border border-brand/25 bg-brand-soft p-5 shadow-elevation-2 sm:p-8 lg:p-9"
            id="room-stay"
            ref={staySectionRef}
            tabIndex={-1}
          >
            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.55fr)] xl:items-end">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-bold text-brand-strong">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Sẵn sàng cho kỳ nghỉ của bạn
                </div>
                <h2
                  className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl"
                  id="room-stay-heading"
                >
                  Chọn kỳ lưu trú
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Chọn ngày nhận, ngày trả và số khách trước khi tiếp tục đặt phòng.
                </p>
                <div className="mt-6 rounded-card bg-surface p-4 shadow-elevation-1 sm:p-5">
                  <RoomStayPicker
                    maxGuests={room.roomType.maxGuests}
                    onStayChange={handleStayChange}
                    stay={stay}
                  />
                </div>
              </div>

              <div className="border-t border-brand/20 pt-6 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                <p className="text-sm font-semibold text-muted">Phòng bạn đang chọn</p>
                <p className="mt-1 text-lg font-bold text-ink">{room.name}</p>
                <p className="mt-4 text-sm font-semibold text-muted">Giá cơ sở</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-brand-strong">
                  {formatMoney(room.roomType.basePrice)}
                  <span className="ml-2 text-sm font-medium text-muted">/ đêm</span>
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Chọn ngày chưa giữ chỗ. Phòng sẽ được kiểm tra lại khi bạn gửi yêu cầu đặt.
                </p>
                <div ref={stayActionRef}>
                  <Button
                    className="mt-6 min-h-12 w-full px-5"
                    onClick={handlePrimaryAction}
                  >
                    {primaryLabel}
                  </Button>
                </div>
                {onFindOtherRooms ? (
                  <button
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm font-bold text-brand-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    onClick={() => onFindOtherRooms(stayReady ? stay : initialStay ?? stay)}
                    type="button"
                  >
                    Tìm phòng khác
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <aside
          aria-label="Tóm tắt phòng"
          className="hidden min-w-0 lg:sticky lg:block lg:top-24"
        >
          <div className="rounded-hero bg-surface p-5 shadow-elevation-3 sm:p-6">
            <p className="text-sm font-semibold text-muted">Tóm tắt căn phòng</p>
            <dl className="mt-5 grid gap-4 border-y border-line py-5">
              <div className="flex items-start gap-3">
                <BedDouble aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">Chỗ ngủ</dt>
                  <dd className="mt-1 text-sm font-bold text-ink">
                    {bedConfiguration ?? "Thông tin giường đang được cập nhật"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">Sức chứa</dt>
                  <dd className="mt-1 text-sm font-bold text-ink">
                    Tối đa {formatNumber(room.roomType.maxGuests)} khách
                  </dd>
                </div>
              </div>
            </dl>

            <div className="pt-5">
              <p className="text-sm font-semibold text-muted">Giá cơ sở</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-brand-strong">
                {formatMoney(room.roomType.basePrice)}
                <span className="ml-1.5 text-sm font-medium text-muted">/ đêm</span>
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{selectedStaySummary}</p>
            </div>

            <Button className="mt-6 min-h-12 w-full" onClick={handlePrimaryAction}>
              {primaryLabel}
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted">
              Chưa giữ chỗ. Phòng sẽ được kiểm tra lại khi bạn gửi yêu cầu đặt.
            </p>
          </div>
        </aside>
      </div>

      {!viewerOpen && showMobileAction && !headerActionVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-sticky border-t border-line bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-elevation-4 lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-muted">{room.name}</p>
              <p className="mt-1 text-sm font-bold text-ink">
                {formatMoney(room.roomType.basePrice)}
                <span className="ml-1 text-xs font-medium text-muted">/ đêm</span>
                {nights !== null ? (
                  <span className="ml-2 text-xs font-semibold text-muted">
                    · {formatNumber(nights)} đêm
                  </span>
                ) : null}
              </p>
            </div>
            <Button className="min-h-11 shrink-0 px-4" onClick={handlePrimaryAction}>
              {primaryLabel}
            </Button>
          </div>
        </div>
      ) : null}

      {viewerOpen && orderedImages.length > 0 ? (
        <RoomGalleryViewer
          images={orderedImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          roomName={room.name}
        />
      ) : null}
    </div>
  );
}
