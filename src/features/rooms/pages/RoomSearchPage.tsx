import { zodResolver } from "@hookform/resolvers/zod";
import {
  BedDouble,
  CalendarDays,
  ChevronDown,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import type { Pagination } from "@/api/types";
import { useAmenityOptions } from "@/features/amenities/hooks";
import { useRoomTypeOptions } from "@/features/room-types";
import { Button } from "@/shared/components/Button";
import { ErrorState } from "@/shared/components/Feedback";
import { Field, Input, Select } from "@/shared/components/FormControls";

import { SearchRoomCard } from "../components/SearchRoomCard";
import { useRoomSearch } from "../hooks";
import { roomSearchFormSchema, type RoomSearchFormValues } from "../schemas";
import type { PublicRoom, SearchRoomsQuery, SearchRoomsSort } from "../types";

/*
 * THESIS: Searching feels like one decisive travel question, not a reservation form.
 * OWN-WORLD: Warm neutral canvas, white editorial room cards, compact controls, blue actions, green availability.
 * STORY: Choose a stay, see real availability, refine only when useful, then book with confidence.
 * FIRST VIEWPORT: Large title above a single horizontal search rail; helpful discovery content fills the idle state.
 * FORM: Progressive search workspace—compact rail first, sticky 25/75 filters and results after search.
 */

interface RoomSearchPageProps {
  onBookRoom?: (room: PublicRoom, search: SearchRoomsQuery) => void;
  onViewRoom?: (roomId: string, search: SearchRoomsQuery) => void;
}

function toLocalDateInputValue(date = new Date()) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 10);
}

const SEARCH_SORTS: Array<{ label: string; value: SearchRoomsSort }> = [
  { label: "Phù hợp nhất", value: "RECOMMENDED" },
  { label: "Giá thấp nhất", value: "PRICE_ASC" },
  { label: "Giá cao nhất", value: "PRICE_DESC" },
  { label: "Phổ biến", value: "POPULARITY" },
  { label: "Mới nhất", value: "NEWEST" },
];

function parsePositivePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseSort(value: string | null): SearchRoomsSort {
  return SEARCH_SORTS.some((option) => option.value === value)
    ? (value as SearchRoomsSort)
    : "RECOMMENDED";
}

function getInitialFormValues(
  searchParams: URLSearchParams,
): RoomSearchFormValues {
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

function toCriteria(
  values: RoomSearchFormValues,
  sort: SearchRoomsSort,
  page = 1,
): SearchRoomsQuery | undefined {
  const guests = Number(values.guests);

  if (
    !values.checkIn ||
    !values.checkOut ||
    values.checkIn >= values.checkOut ||
    !Number.isInteger(guests) ||
    guests < 1
  ) {
    return undefined;
  }

  return {
    amenityIds: values.amenityIds,
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests,
    limit: 12,
    maxPrice: values.maxPrice || undefined,
    minPrice: values.minPrice || undefined,
    page,
    roomTypeId: values.roomTypeId || undefined,
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

function ResultsSkeleton() {
  return (
    <div aria-label="Đang tìm phòng trống" className="grid gap-4" role="status">
      <span className="sr-only">Đang tìm phòng trống…</span>
      {[1, 2, 3].map((item) => (
        <div
          className="grid min-h-64 overflow-hidden rounded-panel bg-surface shadow-elevation-1 motion-safe:animate-pulse md:grid-cols-[38%_1fr]"
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

export function RoomSearchPage({
  onBookRoom,
  onViewRoom,
}: RoomSearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialFormValues] = useState(() =>
    getInitialFormValues(searchParams),
  );
  const [sort, setSort] = useState<SearchRoomsSort>(() =>
    parseSort(searchParams.get("sort")),
  );
  const initialPage = parsePositivePage(searchParams.get("page"));
  const [criteria, setCriteria] = useState<SearchRoomsQuery | undefined>(() =>
    toCriteria(initialFormValues, sort, initialPage),
  );
  const [loadedRooms, setLoadedRooms] = useState<PublicRoom[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const roomTypesQuery = useRoomTypeOptions();
  const amenitiesQuery = useAmenityOptions(criteria !== undefined);
  const searchQuery = useRoomSearch(criteria);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const previousAdvancedRef = useRef("");
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setValue,
    trigger,
    watch,
  } = useForm<RoomSearchFormValues>({
    defaultValues: initialFormValues,
    resolver: zodResolver(roomSearchFormSchema),
  });
  const guests = Number(watch("guests")) || 1;
  const checkIn = watch("checkIn");
  const roomTypeId = watch("roomTypeId");
  const minPrice = watch("minPrice");
  const maxPrice = watch("maxPrice");
  const amenityIds = watch("amenityIds");
  const advancedKey = JSON.stringify({
    amenityIds,
    maxPrice,
    minPrice,
    roomTypeId,
  });
  const today = useMemo(() => toLocalDateInputValue(), []);

  const commitSearch = useCallback(
    (values: RoomSearchFormValues, nextSort: SearchRoomsSort, page = 1) => {
      const nextCriteria = toCriteria(values, nextSort, page);
      if (!nextCriteria) return;
      if (page === 1) {
        setLoadedRooms([]);
        setPagination(undefined);
      }
      setCriteria(nextCriteria);
      setSearchParams(buildSearchParams(values, nextSort, page), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (criteria === undefined) {
      previousAdvancedRef.current = advancedKey;
      return;
    }
    if (previousAdvancedRef.current === "") {
      previousAdvancedRef.current = advancedKey;
      return;
    }
    if (previousAdvancedRef.current === advancedKey) return;
    previousAdvancedRef.current = advancedKey;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void trigger(["amenityIds", "maxPrice", "minPrice", "roomTypeId"]).then(
        (valid) => {
          if (valid) commitSearch(getValues(), sort);
        },
      );
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [advancedKey, commitSearch, criteria, getValues, sort, trigger]);

  useEffect(() => {
    if (!searchQuery.isSuccess || !searchQuery.data || !criteria) return;

    setLoadedRooms((current) => {
      if ((criteria.page ?? 1) === 1) return searchQuery.data.items;
      const knownIds = new Set(current.map((room) => room.id));
      return [
        ...current,
        ...searchQuery.data.items.filter((room) => !knownIds.has(room.id)),
      ];
    });
    setPagination(searchQuery.data.pagination);
  }, [criteria, searchQuery.data, searchQuery.isSuccess]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    const roomType = roomTypesQuery.data?.find(
      (item) => item.id === roomTypeId,
    );
    if (roomType) filters.push({ key: "roomTypeId", label: roomType.name });
    if (minPrice) filters.push({ key: "minPrice", label: `Từ ${minPrice} ₫` });
    if (maxPrice) filters.push({ key: "maxPrice", label: `Đến ${maxPrice} ₫` });
    for (const amenityId of amenityIds) {
      const amenity = amenitiesQuery.data?.find(
        (item) => item.id === amenityId,
      );
      if (amenity)
        filters.push({ key: `amenity:${amenityId}`, label: amenity.name });
    }
    return filters;
  }, [
    amenitiesQuery.data,
    amenityIds,
    maxPrice,
    minPrice,
    roomTypeId,
    roomTypesQuery.data,
  ]);

  function removeFilter(key: string) {
    if (key === "roomTypeId" || key === "minPrice" || key === "maxPrice") {
      setValue(key, "");
    } else if (key.startsWith("amenity:")) {
      const id = key.slice("amenity:".length);
      setValue(
        "amenityIds",
        getValues("amenityIds").filter((item) => item !== id),
      );
    }
  }

  const total = pagination?.total ?? loadedRooms.length;
  const canLoadMore =
    criteria !== undefined &&
    pagination !== undefined &&
    pagination.page < pagination.totalPages;
  const loadMoreError = searchQuery.isError && loadedRooms.length > 0;

  return (
    <div className="grid min-w-0 gap-6 lg:gap-8">
      <header>
        <h1 className="max-w-3xl text-3xl font-black tracking-[-0.03em] text-ink sm:text-5xl">
          Tìm nơi nghỉ phù hợp với hành trình của bạn
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          Chọn kỳ lưu trú và số khách. Chúng tôi chỉ hiển thị những phòng thực
          sự còn trống.
        </p>
      </header>

      <form
        className="grid gap-3 rounded-panel bg-surface p-3 shadow-elevation-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto] lg:items-end lg:p-4"
        onSubmit={handleSubmit((values) => commitSearch(values, sort, 1))}
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
          loading={searchQuery.isFetching && loadedRooms.length === 0}
          type="submit"
        >
          <Search className="size-4" />
          Tìm phòng
        </Button>
      </form>

      {criteria === undefined ? (
        <section className="grid gap-6 py-6 md:grid-cols-[auto_1fr] md:items-center md:py-10">
          <div className="grid size-28 place-items-center rounded-hero bg-brand-soft text-brand sm:size-36">
            <div className="relative">
              <BedDouble className="size-14 sm:size-16" strokeWidth={1.5} />
              <CalendarDays className="absolute -bottom-3 -right-5 size-8 rounded-control bg-surface p-1.5 shadow-elevation-2" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink">
              Chọn ngày lưu trú để khám phá phòng còn trống
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted sm:grid-cols-2">
              <li>Ngày trả phòng phải sau ngày nhận phòng.</li>
              <li>Bộ lọc chi tiết sẽ xuất hiện sau lần tìm đầu tiên.</li>
            </ul>
            {roomTypesQuery.data?.length ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink">Khám phá:</span>
                {roomTypesQuery.data.slice(0, 3).map((roomType) => (
                  <button
                    className="min-h-10 rounded-full bg-surface px-4 text-sm font-semibold text-ink shadow-elevation-1 hover:bg-brand-soft hover:text-brand-strong"
                    key={roomType.id}
                    onClick={() => setValue("roomTypeId", roomType.id)}
                    type="button"
                  >
                    {roomType.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,3fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <button
              aria-controls="room-search-filters"
              aria-expanded={filtersOpen}
              className="flex min-h-11 w-full items-center justify-between rounded-control bg-surface px-4 text-sm font-bold text-ink shadow-elevation-1 lg:hidden"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="size-4" /> Bộ lọc
              </span>
              <span>{filtersOpen ? "Đóng" : activeFilters.length || "Mở"}</span>
            </button>
            <div
              className={`${filtersOpen ? "grid" : "hidden"} mt-3 gap-5 rounded-panel bg-surface p-5 shadow-elevation-1 lg:mt-0 lg:grid`}
              id="room-search-filters"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-ink">Lọc kết quả</h2>
                {activeFilters.length ? (
                  <button
                    className="text-xs font-bold text-brand-strong hover:underline"
                    onClick={() => {
                      setValue("roomTypeId", "");
                      setValue("minPrice", "");
                      setValue("maxPrice", "");
                      setValue("amenityIds", []);
                    }}
                    type="button"
                  >
                    Xóa tất cả
                  </button>
                ) : null}
              </div>
              <Field error={errors.roomTypeId?.message} label="Loại phòng">
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
                  Khoảng giá mỗi đêm
                </legend>
                <Field error={errors.minPrice?.message} label="Từ">
                  <Input
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
                    inputMode="decimal"
                    min={0}
                    placeholder="3.000.000 ₫"
                    step="0.01"
                    type="number"
                    {...register("maxPrice")}
                  />
                </Field>
              </fieldset>
              {amenitiesQuery.data?.length ? (
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold text-ink">
                    Tiện nghi
                  </legend>
                  <div className="grid gap-2">
                    {amenitiesQuery.data.map((amenity) => (
                      <label
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm font-medium text-ink hover:bg-surface-muted"
                        key={amenity.id}
                      >
                        <input
                          className="size-4 accent-blue-600"
                          type="checkbox"
                          value={amenity.id}
                          {...register("amenityIds")}
                        />
                        {amenity.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              {roomTypesQuery.isError || amenitiesQuery.isError ? (
                <p className="text-sm text-danger">
                  Không thể tải đầy đủ bộ lọc. Hãy thử tải lại trang.
                </p>
              ) : null}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div aria-atomic="true" aria-live="polite">
                <p className="flex items-center gap-2 text-sm font-bold text-success">
                  <Sparkles className="size-4" />{" "}
                  {searchQuery.isPending && loadedRooms.length === 0
                    ? "Đang kiểm tra phòng trống"
                    : `${total} phòng đang còn trống`}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">
                  Phòng phù hợp với kỳ lưu trú
                </h2>
              </div>
              <Field label="Sắp xếp">
                <Select
                  className="sm:min-w-48"
                  onChange={(event) => {
                    const nextSort = parseSort(event.target.value);
                    setSort(nextSort);
                    commitSearch(getValues(), nextSort, 1);
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
            </div>

            {activeFilters.length ? (
              <div
                className="mt-4 flex flex-wrap gap-2"
                aria-label="Bộ lọc đang chọn"
              >
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
              {searchQuery.isPending && loadedRooms.length === 0 ? (
                <ResultsSkeleton />
              ) : searchQuery.isError && loadedRooms.length === 0 ? (
                <ErrorState
                  description={getErrorMessage(searchQuery.error)}
                  onRetry={() => void searchQuery.refetch()}
                />
              ) : loadedRooms.length === 0 ? (
                <div className="rounded-panel bg-surface px-6 py-12 text-center shadow-elevation-1">
                  <h3 className="text-xl font-black text-ink">
                    Chưa tìm thấy phòng phù hợp
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
                    Hãy thử đổi ngày lưu trú, giảm số khách hoặc xóa bớt bộ lọc.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5">
                  {loadedRooms.map((room) => (
                    <SearchRoomCard
                      key={room.id}
                      onBook={
                        onBookRoom
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

            {loadMoreError ? (
              <div
                className="mt-6 flex flex-col items-start justify-between gap-3 rounded-card bg-red-50 p-4 text-sm text-danger sm:flex-row sm:items-center"
                role="alert"
              >
                <p>{getErrorMessage(searchQuery.error)}</p>
                <Button
                  className="shrink-0"
                  onClick={() => void searchQuery.refetch()}
                  variant="outline"
                >
                  Thử tải lại
                </Button>
              </div>
            ) : null}

            {canLoadMore && !loadMoreError ? (
              <div className="mt-6 flex justify-center">
                <Button
                  loading={searchQuery.isFetching}
                  onClick={() =>
                    commitSearch(getValues(), sort, (criteria.page ?? 1) + 1)
                  }
                  variant="outline"
                >
                  Xem thêm phòng
                </Button>
              </div>
            ) : null}
          </main>
        </div>
      )}
    </div>
  );
}
