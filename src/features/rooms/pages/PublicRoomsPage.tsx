import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronDown,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import { useAmenityOptions } from "@/features/amenities/hooks";
import type { Amenity } from "@/features/amenities/types";
import { useRoomTypeOptions } from "@/features/room-types";
import { Button } from "@/shared/components/Button";
import { ErrorState } from "@/shared/components/Feedback";
import { Field, Input, Select } from "@/shared/components/FormControls";
import { PaginationControls } from "@/shared/components/PaginationControls";
import { formatDateOnly } from "@/shared/formatting/formatters";

import { SearchRoomCard } from "../components/SearchRoomCard";
import { useRoomSearch, useRooms } from "../hooks";
import { roomSearchFormSchema, type RoomSearchFormValues } from "../schemas";
import type { PublicRoom, SearchRoomsQuery, SearchRoomsSort } from "../types";

/*
 * Khách xem phòng thật trước, rồi kiểm tra kỳ lưu trú ngay trong cùng một nơi.
 * Bố cục giữ nền trung tính, ảnh phòng và thao tác đặt phòng làm trọng tâm;
 * không tạo một màn tìm kiếm thứ hai hoặc trộn kết quả chưa được kiểm tra theo kỳ lưu trú.
 */

interface PublicRoomsPageProps {
  onBookRoom?: (room: PublicRoom, search: SearchRoomsQuery) => void;
  onViewRoom?: (roomId: string, search?: SearchRoomsQuery) => void;
}

const SEARCH_SORTS: Array<{ label: string; value: SearchRoomsSort }> = [
  { label: "Phù hợp nhất", value: "RECOMMENDED" },
  { label: "Giá thấp nhất", value: "PRICE_ASC" },
  { label: "Giá cao nhất", value: "PRICE_DESC" },
  { label: "Phổ biến", value: "POPULARITY" },
  { label: "Mới nhất", value: "NEWEST" },
];

function toLocalDateInputValue(date = new Date()) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

function parsePositivePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseSort(value: string | null): SearchRoomsSort {
  return SEARCH_SORTS.some((option) => option.value === value)
    ? (value as SearchRoomsSort)
    : "RECOMMENDED";
}

function getFormValues(searchParams: URLSearchParams): RoomSearchFormValues {
  return {
    amenityIds: searchParams
      .getAll("amenityIds")
      .filter((id) => /^[1-9][0-9]*$/.test(id)),
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    guests: searchParams.get("guests") ?? "1",
    maxPrice: searchParams.get("maxPrice") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    roomTypeId: searchParams.get("roomTypeId") ?? "",
  };
}

function toSearchCriteria(
  values: RoomSearchFormValues,
  sort: SearchRoomsSort,
  page: number,
): SearchRoomsQuery | undefined {
  const parsed = roomSearchFormSchema.safeParse(values);

  if (!parsed.success) return undefined;

  return {
    amenityIds: parsed.data.amenityIds,
    checkIn: parsed.data.checkIn,
    checkOut: parsed.data.checkOut,
    guests: Number(parsed.data.guests),
    limit: 12,
    maxPrice: parsed.data.maxPrice || undefined,
    minPrice: parsed.data.minPrice || undefined,
    page,
    roomTypeId: parsed.data.roomTypeId || undefined,
    sort,
  };
}

function buildSearchParams(
  values: RoomSearchFormValues,
  sort: SearchRoomsSort,
  page = 1,
) {
  const params = new URLSearchParams({
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests: values.guests,
  });

  if (values.roomTypeId) params.set("roomTypeId", values.roomTypeId);
  if (values.minPrice) params.set("minPrice", values.minPrice);
  if (values.maxPrice) params.set("maxPrice", values.maxPrice);
  if (sort !== "RECOMMENDED") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  for (const amenityId of values.amenityIds) {
    params.append("amenityIds", amenityId);
  }

  return params;
}

function buildDirectoryParams(
  search: string,
  roomTypeId: string,
  page = 1,
) {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();

  if (trimmedSearch) params.set("search", trimmedSearch);
  if (/^[1-9][0-9]*$/.test(roomTypeId)) {
    params.set("roomTypeId", roomTypeId);
  }
  if (page > 1) params.set("page", String(page));

  return params;
}

function ResultsSkeleton({ label }: { label: string }) {
  return (
    <div aria-label={label} className="grid gap-5" role="status">
      <span className="sr-only">{label}…</span>
      {[1, 2, 3].map((item) => (
        <div
          className="grid min-h-64 overflow-hidden rounded-panel bg-surface shadow-elevation-2 motion-safe:animate-pulse md:grid-cols-[38%_1fr]"
          key={item}
        >
          <div className="bg-surface-muted" />
          <div className="grid content-center gap-4 p-6">
            <div className="h-4 w-1/4 rounded bg-surface-muted" />
            <div className="h-7 w-2/3 rounded bg-surface-muted" />
            <div className="h-4 w-1/2 rounded bg-surface-muted" />
            <div className="h-10 w-full rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AmenityFilterOptions({
  amenities,
  disabled = false,
  isError,
  isPending,
  register,
}: {
  amenities?: Amenity[];
  disabled?: boolean;
  isError: boolean;
  isPending: boolean;
  register: UseFormRegister<RoomSearchFormValues>;
}) {
  if (isPending) {
    return (
      <div aria-label="Đang tải tiện ích" className="grid gap-2" role="status">
        {[1, 2, 3, 4].map((item) => (
          <span
            className="h-10 rounded-control bg-surface-muted motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-control bg-danger-soft px-3 py-2.5 text-xs leading-5 text-danger">
        Không thể tải tiện ích. Hãy thử tải lại trang.
      </p>
    );
  }

  if (!amenities?.length) {
    return <p className="text-xs leading-5 text-muted">Chưa có tiện ích để lọc.</p>;
  }

  return (
    <div className="grid max-h-64 gap-1 overflow-y-auto pr-1">
      {amenities.map((amenity) => (
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm font-semibold text-ink hover:bg-surface-muted has-[:checked]:bg-brand-soft has-[:checked]:text-brand-strong"
          key={amenity.id}
        >
          <input
            className="size-4 accent-blue-600"
            disabled={disabled}
            type="checkbox"
            value={amenity.id}
            {...register("amenityIds")}
          />
          <span className="min-w-0 truncate">{amenity.name}</span>
        </label>
      ))}
    </div>
  );
}

export function PublicRoomsPage({
  onBookRoom,
  onViewRoom,
}: PublicRoomsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState(
    () => searchParams.get("search") ?? "",
  );
  const roomTypesQuery = useRoomTypeOptions();
  const initialValues = useMemo(
    () => getFormValues(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  );
  const sort = useMemo(
    () => parseSort(new URLSearchParams(searchParamsKey).get("sort")),
    [searchParamsKey],
  );
  const page = useMemo(
    () => parsePositivePage(new URLSearchParams(searchParamsKey).get("page")),
    [searchParamsKey],
  );
  const criteria = useMemo(
    () => toSearchCriteria(initialValues, sort, page),
    [initialValues, page, sort],
  );
  const appliedDirectorySearch = useMemo(
    () => new URLSearchParams(searchParamsKey).get("search") ?? "",
    [searchParamsKey],
  );
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<RoomSearchFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(roomSearchFormSchema),
  });
  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const guests = Number(watch("guests")) || 1;
  const selectedAmenityIds = watch("amenityIds") ?? [];
  const today = useMemo(() => toLocalDateInputValue(), []);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsKey);
    reset(getFormValues(nextParams));
    setDirectorySearch(nextParams.get("search") ?? "");
  }, [reset, searchParamsKey]);

  const directoryQuery = useRooms(
    {
      limit: 12,
      page,
      roomTypeId: criteria ? undefined : initialValues.roomTypeId || undefined,
      search: criteria ? undefined : appliedDirectorySearch || undefined,
    },
    criteria === undefined,
  );
  const searchQuery = useRoomSearch(criteria);
  const amenitiesQuery = useAmenityOptions();
  const activeQuery = criteria ? searchQuery : directoryQuery;
  const rooms = activeQuery.data?.items ?? [];
  const pagination = activeQuery.data?.pagination;
  const total = pagination?.total ?? rooms.length;
  const hasAvailableResults = Boolean(
    criteria && !activeQuery.isPending && !activeQuery.isError && total > 0,
  );
  const hasPendingStay = Boolean(
    criteria &&
      (checkIn !== criteria.checkIn ||
        checkOut !== criteria.checkOut ||
        guests !== criteria.guests),
  );

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    const roomType = roomTypesQuery.data?.find(
      (item) => item.id === initialValues.roomTypeId,
    );

    if (!criteria && appliedDirectorySearch) {
      filters.push({ key: "search", label: `“${appliedDirectorySearch}”` });
    }
    if (roomType) filters.push({ key: "roomTypeId", label: roomType.name });
    if (criteria && initialValues.minPrice) {
      filters.push({ key: "minPrice", label: `Từ ${initialValues.minPrice} ₫` });
    }
    if (criteria && initialValues.maxPrice) {
      filters.push({ key: "maxPrice", label: `Đến ${initialValues.maxPrice} ₫` });
    }
    if (criteria) {
      for (const amenityId of initialValues.amenityIds) {
        const amenity = amenitiesQuery.data?.find(
          (item) => item.id === amenityId,
        );
        if (amenity) {
          filters.push({ key: `amenity:${amenityId}`, label: amenity.name });
        }
      }
    }

    return filters;
  }, [
    amenitiesQuery.data,
    appliedDirectorySearch,
    criteria,
    initialValues,
    roomTypesQuery.data,
  ]);

  function commitDirectory(nextPage = 1) {
    setSearchParams(
      buildDirectoryParams(
        directorySearch,
        getValues("roomTypeId"),
        nextPage,
      ),
    );
  }

  function submitSearch(values: RoomSearchFormValues) {
    setSearchParams(buildSearchParams(values, sort, 1));
  }

  function applyAdvancedFilters() {
    if (!criteria || hasPendingStay) return;

    void trigger(["amenityIds", "maxPrice", "minPrice", "roomTypeId"]).then(
      (valid) => {
        if (valid) {
          setSearchParams(buildSearchParams(getValues(), sort, 1));
        }
      },
    );
  }

  function clearStay() {
    setSearchParams(
      buildDirectoryParams(
        directorySearch,
        getValues("roomTypeId"),
        1,
      ),
    );
  }

  function clearAllFilters() {
    if (!criteria) {
      setDirectorySearch("");
      setValue("roomTypeId", "");
      setSearchParams(new URLSearchParams());
      return;
    }

    const nextValues = {
      ...initialValues,
      amenityIds: [],
      maxPrice: "",
      minPrice: "",
      roomTypeId: "",
    };
    setSearchParams(buildSearchParams(nextValues, sort, 1));
  }

  function removeFilter(key: string) {
    if (!criteria) {
      if (key === "search") {
        setDirectorySearch("");
        setSearchParams(buildDirectoryParams("", initialValues.roomTypeId, 1));
      }
      if (key === "roomTypeId") {
        setValue("roomTypeId", "");
        setSearchParams(buildDirectoryParams(appliedDirectorySearch, "", 1));
      }
      return;
    }

    const nextValues = { ...initialValues };
    if (key === "roomTypeId" || key === "minPrice" || key === "maxPrice") {
      nextValues[key] = "";
    }
    if (key.startsWith("amenity:")) {
      const amenityId = key.slice("amenity:".length);
      nextValues.amenityIds = nextValues.amenityIds.filter(
        (item) => item !== amenityId,
      );
    }
    setSearchParams(buildSearchParams(nextValues, sort, 1));
  }

  function changePage(nextPage: number) {
    if (criteria) {
      setSearchParams(buildSearchParams(initialValues, sort, nextPage));
      return;
    }
    commitDirectory(nextPage);
  }

  return (
    <div className="grid min-w-0 gap-6 lg:gap-8">
      <header className="max-w-3xl animate-soft-rise">
        <p className="text-sm font-bold text-brand-strong">Khám phá phòng</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
          Chọn nơi nghỉ phù hợp với kỳ lưu trú của bạn
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Xem các phòng trước, hoặc nhập ngày và số khách để kiểm tra phòng còn
          trống ngay tại đây.
        </p>
      </header>

      <form
        aria-label="Tìm phòng trống"
        className="grid gap-3 rounded-panel bg-surface p-3 shadow-elevation-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto] lg:items-end lg:p-4"
        noValidate
        onSubmit={handleSubmit(submitSearch)}
      >
        <Field error={errors.checkIn?.message} label="Nhận phòng" required>
          <Input min={today} type="date" {...register("checkIn")} />
        </Field>
        <Field error={errors.checkOut?.message} label="Trả phòng" required>
          <Input min={checkIn || today} type="date" {...register("checkOut")} />
        </Field>
        <div className="relative grid gap-1.5">
          <span className="text-sm font-semibold text-ink">Khách</span>
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink shadow-elevation-1 transition hover:border-muted/60 focus-visible:outline-brand">
              {guests} khách
              <ChevronDown className="size-4 transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-overlay mt-2 grid min-w-64 gap-3 rounded-card bg-surface p-4 shadow-elevation-4">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-bold text-ink">Số khách</p>
                  <p className="mt-1 text-xs text-muted">Tối thiểu 1 khách</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Giảm số khách"
                    className="grid size-11 place-items-center rounded-full border border-line text-ink hover:bg-surface-muted disabled:opacity-40"
                    disabled={guests <= 1}
                    onClick={() =>
                      setValue("guests", String(Math.max(1, guests - 1)))
                    }
                    type="button"
                  >
                    <Minus className="size-4" />
                  </button>
                  <output className="w-5 text-center font-black text-ink">
                    {guests}
                  </output>
                  <button
                    aria-label="Tăng số khách"
                    className="grid size-11 place-items-center rounded-full border border-line text-ink hover:bg-surface-muted"
                    onClick={() => setValue("guests", String(guests + 1))}
                    type="button"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <button
                className="min-h-10 rounded-control bg-surface-muted px-4 text-sm font-bold text-ink hover:bg-brand-soft hover:text-brand-strong"
                onClick={(event) =>
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open")
                }
                type="button"
              >
                Xong
              </button>
            </div>
          </details>
          <input type="hidden" {...register("guests")} />
          {errors.guests?.message ? (
            <p className="text-sm text-danger" role="alert">
              {errors.guests.message}
            </p>
          ) : null}
        </div>
        <Button
          className="min-h-11 w-full px-6"
          loading={Boolean(criteria && searchQuery.isFetching)}
          type="submit"
        >
          <Search className="size-4" />
          Tìm phòng trống
        </Button>
      </form>

      <section className="rounded-panel border border-line/80 bg-surface/90 p-4 shadow-elevation-1 lg:p-5">
        <div
          aria-live="polite"
          className="flex flex-col gap-3 rounded-card bg-canvas/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
        {criteria ? (
          <div className="flex min-w-0 items-start gap-3">
            <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="font-bold text-ink">
                Kỳ lưu trú: {formatDateOnly(criteria.checkIn)} –{" "}
                {formatDateOnly(criteria.checkOut)} · {criteria.guests} khách
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Tình trạng phòng có thể thay đổi cho đến khi bạn tạo đặt phòng.
              </p>
              {hasPendingStay ? (
                <p className="mt-2 text-sm font-semibold text-warning">
                  Bạn đã thay đổi kỳ lưu trú. Tìm lại để cập nhật kết quả trước khi đặt.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <p className="font-bold text-ink">Khám phá các phòng hiện có</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Nhập ngày khi bạn muốn kiểm tra phòng trống cho một kỳ lưu trú cụ thể.
            </p>
          </div>
        )}
        {criteria ? (
          <Button className="shrink-0" onClick={clearStay} variant="text">
            Xóa ngày
          </Button>
        ) : null}
        </div>

        <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(17rem,19rem)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <button
            aria-controls="public-room-filters"
            aria-expanded={filtersOpen}
            className="flex min-h-11 w-full items-center justify-between rounded-control bg-canvas px-4 text-sm font-bold text-ink shadow-elevation-1 lg:hidden"
            onClick={() => setFiltersOpen((open) => !open)}
            type="button"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" /> Bộ lọc
            </span>
            <span>{filtersOpen ? "Đóng" : activeFilters.length || "Mở"}</span>
          </button>

          <aside
            className={`${filtersOpen ? "grid" : "hidden"} mt-3 gap-5 rounded-panel border border-line bg-surface p-5 shadow-elevation-1 lg:mt-0 lg:grid`}
            id="public-room-filters"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-ink">
                {criteria ? "Lọc kết quả" : "Lọc danh mục"}
              </h2>
              {activeFilters.length ? (
                <button
                  className="text-xs font-bold text-brand-strong hover:underline"
                  onClick={clearAllFilters}
                  type="button"
                >
                  Xóa tất cả
                </button>
              ) : null}
            </div>

            {!criteria ? (
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  commitDirectory(1);
                }}
              >
                <Field label="Tìm phòng">
                  <Input
                    maxLength={160}
                    onChange={(event) => setDirectorySearch(event.target.value)}
                    placeholder="Tên hoặc mô tả phòng"
                    value={directorySearch}
                  />
                </Field>
                <Field label="Loại phòng">
                  <Select
                    disabled={roomTypesQuery.isPending || roomTypesQuery.isError}
                    {...register("roomTypeId")}
                  >
                    <option value="">Tất cả loại phòng</option>
                    {roomTypesQuery.data?.map((roomType) => (
                      <option key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold text-ink">
                    Tiện ích mong muốn
                  </legend>
                  <p className="text-xs leading-5 text-muted">
                    Lựa chọn này sẽ được áp dụng khi bạn tìm phòng trống.
                  </p>
                  <AmenityFilterOptions
                    amenities={amenitiesQuery.data}
                    isError={amenitiesQuery.isError}
                    isPending={amenitiesQuery.isPending}
                    register={register}
                  />
                  <p className="rounded-control bg-brand-soft/70 px-3 py-2.5 text-xs leading-5 text-brand-strong">
                    {selectedAmenityIds.length
                      ? `Đã chọn ${selectedAmenityIds.length} tiện ích cho kỳ lưu trú.`
                      : "Chưa chọn tiện ích. Bạn vẫn có thể tìm tất cả phòng."}
                  </p>
                </fieldset>
                <Button type="submit">Áp dụng danh mục</Button>
              </form>
            ) : (
              <div className="grid gap-5">
                <Field error={errors.roomTypeId?.message} label="Loại phòng">
                  <Select
                    disabled={roomTypesQuery.isPending || roomTypesQuery.isError || hasPendingStay}
                    {...register("roomTypeId")}
                  >
                    <option value="">Tất cả loại phòng</option>
                    {roomTypesQuery.data?.map((roomType) => (
                      <option key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold text-ink">
                    Khoảng giá mỗi đêm
                  </legend>
                  <Field error={errors.minPrice?.message} label="Từ">
                    <Input
                      disabled={hasPendingStay}
                      inputMode="decimal"
                      min={0}
                      placeholder="0 ₫"
                      step="0.01"
                      type="number"
                      {...register("minPrice")}
                    />
                  </Field>
                  <Field error={errors.maxPrice?.message} label="Đến">
                    <Input
                      disabled={hasPendingStay}
                      inputMode="decimal"
                      min={0}
                      placeholder="3.000.000 ₫"
                      step="0.01"
                      type="number"
                      {...register("maxPrice")}
                    />
                  </Field>
                </fieldset>
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold text-ink">Tiện nghi</legend>
                  <p className="text-xs leading-5 text-muted">
                    Chỉ hiển thị các phòng có đủ tiện ích bạn đã chọn.
                  </p>
                  <AmenityFilterOptions
                    amenities={amenitiesQuery.data}
                    disabled={hasPendingStay}
                    isError={amenitiesQuery.isError}
                    isPending={amenitiesQuery.isPending}
                    register={register}
                  />
                </fieldset>
                <Button disabled={hasPendingStay} onClick={applyAdvancedFilters}>
                  Áp dụng bộ lọc
                </Button>
                {roomTypesQuery.isError ? (
                  <p className="text-sm leading-6 text-danger">
                    Không thể tải đầy đủ loại phòng. Hãy thử tải lại trang.
                  </p>
                ) : null}
              </div>
            )}
          </aside>
        </div>

        <section className="min-w-0" aria-labelledby="room-results-heading">
          <div className="flex flex-col gap-4 rounded-card bg-canvas/80 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div aria-atomic="true" aria-live="polite">
              <p className={`flex items-center gap-2 text-sm font-bold ${hasAvailableResults ? "text-success" : "text-brand-strong"}`}>
                {hasAvailableResults ? <Sparkles className="size-4" /> : null}
                {activeQuery.isPending
                  ? criteria
                    ? "Đang kiểm tra phòng trống"
                    : "Đang tải danh mục phòng"
                  : activeQuery.isError
                    ? "Chưa thể tải kết quả"
                    : criteria
                      ? total > 0
                        ? `${total} phòng phù hợp cho kỳ đã chọn`
                        : "Chưa có phòng phù hợp cho kỳ đã chọn"
                      : `${total} lựa chọn đang hiển thị`}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink" id="room-results-heading">
                {criteria ? "Phòng phù hợp với kỳ lưu trú" : "Khám phá các phòng"}
              </h2>
            </div>
            {criteria ? (
              <Field label="Sắp xếp">
                <Select
                  className="sm:min-w-48"
                  disabled={hasPendingStay}
                  onChange={(event) => {
                    const nextSort = parseSort(event.target.value);
                    setSearchParams(buildSearchParams(initialValues, nextSort, 1));
                  }}
                  value={sort}
                >
                  {SEARCH_SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>

          {activeFilters.length ? (
            <div aria-label="Bộ lọc đang chọn" className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <button
                  aria-label={`Xóa bộ lọc ${filter.label}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full bg-brand-soft px-3 text-xs font-bold text-brand-strong hover:bg-blue-100"
                  key={filter.key}
                  onClick={() => removeFilter(filter.key)}
                  type="button"
                >
                  {filter.label}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            {activeQuery.isPending ? (
              <ResultsSkeleton label={criteria ? "Đang tìm phòng trống" : "Đang tải danh sách phòng"} />
            ) : activeQuery.isError ? (
              <ErrorState
                description={getErrorMessage(activeQuery.error)}
                onRetry={() => void activeQuery.refetch()}
              />
            ) : rooms.length === 0 ? (
              <div className="rounded-panel bg-surface px-6 py-12 text-center shadow-elevation-2">
                <h3 className="text-xl font-black text-ink">
                  {criteria ? "Chưa tìm thấy phòng phù hợp" : "Chưa có phòng để hiển thị"}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
                  {criteria
                    ? "Hãy thử chọn ngày khác, giảm số khách hoặc bớt tiện ích đã chọn."
                    : "Hãy thử xóa điều kiện lọc hoặc quay lại sau."}
                </p>
                {criteria ? (
                  <div className="mt-5 flex justify-center gap-3">
                    <Button onClick={clearAllFilters} variant="outline">Xóa bộ lọc</Button>
                    <Button onClick={clearStay} variant="text">Xem tất cả phòng</Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-5">
                {rooms.map((room) => (
                  <SearchRoomCard
                    available={Boolean(criteria && !hasPendingStay)}
                    key={room.id}
                    onBook={
                      criteria && !hasPendingStay && onBookRoom
                        ? (selected) => onBookRoom(selected, criteria)
                        : undefined
                    }
                    onView={
                      onViewRoom
                        ? (roomId) => onViewRoom(roomId, criteria)
                        : undefined
                    }
                    room={room}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <PaginationControls onPageChange={changePage} pagination={pagination} />
          </div>
        </section>
      </div>
      </section>
    </div>
  );
}
