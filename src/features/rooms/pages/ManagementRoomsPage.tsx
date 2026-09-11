import { useEffect, useState, type FormEvent } from "react";

import { getErrorMessage } from "@/api/errors";
import { useRoomTypeOptions } from "@/features/room-types";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/shared/components/Feedback";
import { Field, Input, Select } from "@/shared/components/FormControls";
import { PageHeader } from "@/shared/components/PageHeader";
import { PaginationControls } from "@/shared/components/PaginationControls";
import { formatMoney, formatNumber } from "@/shared/formatting/formatters";

import { RoomAvailabilitySummary } from "../components/RoomAvailabilitySummary";
import { RoomImage } from "../components/RoomImage";
import { RoomStatusBadge } from "../components/RoomStatusBadge";
import {
  useDeleteRoom,
  useManagementRooms,
  useUpdateRoomStatus,
} from "../hooks";
import { resolveRoomImageUrl } from "../image-url";
import { getRoomStatusLabel } from "../status";
import {
  ROOM_STATUSES,
  type ManagementRole,
  type RoomStatus,
} from "../types";

interface StatusDraft {
  roomId: string;
  status: RoomStatus;
}

interface ManagementRoomsPageProps {
  onCreateRoom?: () => void;
  onEditRoom?: (roomId: string) => void;
  onManageImages?: (roomId: string) => void;
  onViewRoom?: (roomId: string) => void;
  role: ManagementRole;
}

function statusOptionsFor(role: ManagementRole) {
  return role === "ADMIN"
    ? ROOM_STATUSES
    : ROOM_STATUSES.filter((status) => status !== "HIDDEN");
}

export function ManagementRoomsPage({
  onCreateRoom,
  onEditRoom,
  onManageImages,
  onViewRoom,
  role,
}: ManagementRoomsPageProps) {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [roomTypeDraft, setRoomTypeDraft] = useState("");
  const [statusFilterDraft, setStatusFilterDraft] = useState("");
  const [filters, setFilters] = useState({
    roomTypeId: "",
    search: "",
    status: "",
  });
  const [statusDraft, setStatusDraft] = useState<StatusDraft>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const roomTypesQuery = useRoomTypeOptions();
  const roomsQuery = useManagementRooms({
    page,
    roomTypeId: filters.roomTypeId || undefined,
    search: filters.search || undefined,
    status: (filters.status || undefined) as RoomStatus | undefined,
  });
  const totalPages = roomsQuery.data?.pagination?.totalPages;
  const deleteMutation = useDeleteRoom();
  const statusMutation = useUpdateRoomStatus();
  const actionError = deleteMutation.error ?? statusMutation.error;

  useEffect(() => {
    if (totalPages === undefined) {
      return;
    }

    const lastPage = Math.max(totalPages, 1);

    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [page, totalPages]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      roomTypeId: roomTypeDraft,
      search: searchDraft.trim(),
      status: statusFilterDraft,
    });
    setPage(1);
  }

  function resetFilters() {
    setSearchDraft("");
    setRoomTypeDraft("");
    setStatusFilterDraft("");
    setFilters({ roomTypeId: "", search: "", status: "" });
    setPage(1);
  }

  function saveStatus() {
    if (!statusDraft) {
      return;
    }

    setSuccessMessage(undefined);
    statusMutation.mutate(
      {
        id: statusDraft.roomId,
        status: statusDraft.status,
      },
      {
        onSuccess: () => {
          setStatusDraft(undefined);
          setSuccessMessage("Đã cập nhật trạng thái phòng.");
        },
      },
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          role === "ADMIN" ? (
            <Button
              disabled={
                roomTypesQuery.isPending ||
                roomTypesQuery.isError ||
                (roomTypesQuery.data?.length ?? 0) === 0
              }
              onClick={() => onCreateRoom?.()}
            >
              Thêm phòng
            </Button>
          ) : undefined
        }
        description={
          role === "ADMIN"
            ? "Quản lý thông tin, trạng thái vận hành, lịch đặt và thư viện ảnh của phòng."
            : "Booking giữ lịch phòng; trạng thái chỉ chuyển sang Khách đang lưu trú sau khi check-in."
        }
        eyebrow={role === "ADMIN" ? "Khu vực quản lý" : "Quầy lễ tân"}
        title="Phòng"
      />

      {roomTypesQuery.isError ? (
        <Alert tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Không thể tải danh sách loại phòng:{" "}
              {getErrorMessage(roomTypesQuery.error)}
            </span>
            <Button
              loading={roomTypesQuery.isFetching}
              onClick={() => void roomTypesQuery.refetch()}
              variant="outline"
            >
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : null}

      {role === "ADMIN" &&
      !roomTypesQuery.isPending &&
      !roomTypesQuery.isError &&
      roomTypesQuery.data?.length === 0 ? (
        <Alert tone="warning">
          Cần tạo ít nhất một loại phòng trước khi thêm phòng mới.
        </Alert>
      ) : null}

      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      {!successMessage && actionError ? (
        <Alert tone="error">{getErrorMessage(actionError)}</Alert>
      ) : null}

      <Card>
        <form
          className="grid gap-3 md:grid-cols-2 md:items-end xl:grid-cols-[minmax(0,1fr)_14rem_12rem_auto_auto]"
          onSubmit={applyFilters}
        >
          <Field label="Tìm phòng">
            <Input
              aria-label="Tìm phòng quản lý"
              maxLength={160}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tên, số phòng hoặc mô tả"
              value={searchDraft}
            />
          </Field>
          <Field label="Loại phòng">
            <Select
              aria-label="Lọc loại phòng"
              disabled={roomTypesQuery.isPending || roomTypesQuery.isError}
              onChange={(event) => setRoomTypeDraft(event.target.value)}
              value={roomTypeDraft}
            >
              <option value="">Tất cả loại phòng</option>
              {roomTypesQuery.data?.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trạng thái vận hành">
            <Select
              aria-label="Lọc trạng thái phòng"
              onChange={(event) => setStatusFilterDraft(event.target.value)}
              value={statusFilterDraft}
            >
              <option value="">Tất cả trạng thái</option>
              {ROOM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getRoomStatusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Button className="w-full xl:w-auto" type="submit" variant="outline">
            Lọc
          </Button>
          <Button
            className="w-full xl:w-auto"
            onClick={resetFilters}
            variant="text"
          >
            Đặt lại
          </Button>
        </form>
      </Card>

      {roomsQuery.isPending ? (
        <LoadingState label="Đang tải danh sách phòng quản lý…" />
      ) : roomsQuery.isError ? (
        <ErrorState
          description={getErrorMessage(roomsQuery.error)}
          onRetry={() => void roomsQuery.refetch()}
        />
      ) : roomsQuery.data.items.length === 0 ? (
        <EmptyState
          action={
            filters.roomTypeId || filters.search || filters.status ? (
              <Button onClick={resetFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            ) : undefined
          }
          description="Thử thay đổi bộ lọc hoặc thêm phòng mới."
          title="Chưa có phòng phù hợp"
        />
      ) : (
        <>
          <div className="grid gap-4">
            {roomsQuery.data.items.map((room) => {
              const cover =
                room.images.find((image) => image.isCover) ?? room.images[0];
              const isEditingStatus = statusDraft?.roomId === room.id;
              const staffCannotChangeHidden =
                role === "STAFF" && room.status === "HIDDEN";

              return (
                <Card key={room.id}>
                  <div className="grid gap-5 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-center">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                      {cover ? (
                        <RoomImage
                          alt={`Ảnh phòng ${room.roomNumber}`}
                          className="size-full object-cover"
                          fallbackLabel="Ảnh lỗi"
                          loading="lazy"
                          src={resolveRoomImageUrl(cover.imageUrl)}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-xs font-semibold text-slate-500">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-950">
                          {room.roomNumber} · {room.name}
                        </h2>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {room.roomType.name} · Tối đa{" "}
                        {formatNumber(room.roomType.maxGuests)} khách ·{" "}
                        {formatMoney(room.roomType.basePrice)}/đêm
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {room.description || "Chưa có mô tả."}
                      </p>

                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                        <RoomAvailabilitySummary
                          summary={room.calendarSummary}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                              Hiện trạng phòng
                            </span>
                            <RoomStatusBadge status={room.status} />
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            Booking chỉ giữ lịch. Phòng có khách sau khi nhân
                            viên thực hiện check-in.
                          </p>
                        </div>
                      </div>

                      {isEditingStatus ? (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Select
                            aria-label={`Trạng thái phòng ${room.roomNumber}`}
                            className="max-w-52"
                            onChange={(event) =>
                              setStatusDraft({
                                roomId: room.id,
                                status: event.target.value as RoomStatus,
                              })
                            }
                            value={statusDraft.status}
                          >
                            {statusOptionsFor(role).map((status) => (
                              <option key={status} value={status}>
                                {getRoomStatusLabel(status)}
                              </option>
                            ))}
                          </Select>
                          <Button
                            loading={statusMutation.isPending}
                            onClick={saveStatus}
                          >
                            Lưu trạng thái
                          </Button>
                          <Button
                            disabled={statusMutation.isPending}
                            onClick={() => setStatusDraft(undefined)}
                            variant="text"
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : staffCannotChangeHidden ? (
                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          Chỉ quản trị viên có thể mở lại phòng đã ẩn.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 md:max-w-64 md:justify-end">
                      {onViewRoom ? (
                        <Button
                          onClick={() => onViewRoom(room.id)}
                          variant="outline"
                        >
                          Xem chi tiết
                        </Button>
                      ) : null}
                      {!isEditingStatus && !staffCannotChangeHidden ? (
                        <Button
                          onClick={() =>
                            setStatusDraft({
                              roomId: room.id,
                              status: room.status,
                            })
                          }
                          variant="outline"
                        >
                          Đổi trạng thái
                        </Button>
                      ) : null}
                      {role === "ADMIN" ? (
                        <>
                          {onEditRoom ? (
                            <Button
                              onClick={() => onEditRoom(room.id)}
                              variant="outline"
                            >
                              Chỉnh sửa
                            </Button>
                          ) : null}
                          {onManageImages ? (
                            <Button
                              onClick={() => onManageImages(room.id)}
                              variant="outline"
                            >
                              Quản lý ảnh
                            </Button>
                          ) : null}
                          <Button
                            loading={
                              deleteMutation.isPending &&
                              deleteMutation.variables === room.id
                            }
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Xóa vĩnh viễn phòng ${room.roomNumber}? Phòng có lịch sử đặt sẽ không thể xóa.`,
                                )
                              ) {
                                setSuccessMessage(undefined);
                                deleteMutation.mutate(room.id, {
                                  onSuccess: () =>
                                    setSuccessMessage("Đã xóa phòng."),
                                });
                              }
                            }}
                            variant="danger"
                          >
                            Xóa
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <PaginationControls
            onPageChange={setPage}
            pagination={roomsQuery.data.pagination}
          />
        </>
      )}
    </div>
  );
}
