import { apiRequest } from "@/api/client";
import type { Pagination } from "@/api/types";

import type {
  BlockRoomDatesInput,
  CreateRoomImageInput,
  CreateRoomInput,
  ListAvailableRoomsQuery,
  ListManagementRoomsQuery,
  ListRoomsQuery,
  ManagementRoom,
  PublicRoom,
  Room,
  RoomCalendarEntry,
  RoomCalendarRange,
  RoomImage,
  RoomStatus,
  SearchRoomsQuery,
  UnblockRoomDatesResult,
  UpdateRoomInput,
} from "./types";

export interface PaginatedRooms {
  items: Room[];
  pagination?: Pagination;
}

export interface PaginatedManagementRooms {
  items: ManagementRoom[];
  pagination?: Pagination;
}

export interface PaginatedPublicRooms {
  items: PublicRoom[];
  pagination?: Pagination;
}

export async function listRooms(
  query: ListRoomsQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedPublicRooms> {
  const result = await apiRequest<PublicRoom[]>("/rooms", {
    auth: false,
    query: {
      amenityIds: query.amenityIds,
      limit: query.limit,
      page: query.page,
      roomTypeId: query.roomTypeId,
      search: query.search,
    },
    signal,
  });

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  };
}

export async function searchRooms(
  query: SearchRoomsQuery,
  signal?: AbortSignal,
): Promise<PaginatedPublicRooms> {
  const result = await apiRequest<PublicRoom[]>("/rooms/search", {
    auth: false,
    query: {
      amenityIds: query.amenityIds,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      guests: query.guests,
      limit: query.limit,
      maxPrice: query.maxPrice,
      minPrice: query.minPrice,
      page: query.page,
      roomTypeId: query.roomTypeId,
      sort: query.sort,
    },
    signal,
  });

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  };
}

export async function getRoom(
  id: string,
  signal?: AbortSignal,
): Promise<PublicRoom> {
  const result = await apiRequest<PublicRoom>(`/rooms/${id}`, {
    auth: false,
    signal,
  });

  return result.data;
}

export async function listManagementRooms(
  query: ListManagementRoomsQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedManagementRooms> {
  const result = await apiRequest<ManagementRoom[]>("/management/rooms", {
    query: {
      limit: query.limit,
      page: query.page,
      roomTypeId: query.roomTypeId,
      search: query.search,
      status: query.status,
    },
    signal,
  });

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  };
}

export async function listAvailableRooms(
  query: ListAvailableRoomsQuery,
  signal?: AbortSignal,
): Promise<PaginatedRooms> {
  const result = await apiRequest<Room[]>("/management/rooms/available", {
    query: {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      guests: query.guests,
      limit: query.limit,
      page: query.page,
      roomTypeId: query.roomTypeId,
    },
    signal,
  });

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  };
}

export async function getManagementRoom(
  id: string,
  signal?: AbortSignal,
): Promise<Room> {
  const result = await apiRequest<Room>(`/management/rooms/${id}`, {
    signal,
  });

  return result.data;
}

export async function listRoomCalendar(
  roomId: string,
  range: RoomCalendarRange,
  signal?: AbortSignal,
): Promise<RoomCalendarEntry[]> {
  const result = await apiRequest<RoomCalendarEntry[]>(
    `/management/rooms/${roomId}/calendar`,
    {
      query: {
        from: range.from,
        to: range.to,
      },
      signal,
    },
  );

  return result.data;
}

export async function blockRoomDates(
  roomId: string,
  input: BlockRoomDatesInput,
): Promise<RoomCalendarEntry[]> {
  const result = await apiRequest<RoomCalendarEntry[]>(
    `/management/rooms/${roomId}/blocks`,
    {
      body: input,
      method: "POST",
    },
  );

  return result.data;
}

export async function unblockRoomDates(
  roomId: string,
  range: RoomCalendarRange,
): Promise<UnblockRoomDatesResult> {
  const result = await apiRequest<UnblockRoomDatesResult>(
    `/management/rooms/${roomId}/blocks`,
    {
      method: "DELETE",
      query: {
        from: range.from,
        to: range.to,
      },
    },
  );

  return result.data;
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const result = await apiRequest<Room>("/rooms", {
    body: input,
    method: "POST",
  });

  return result.data;
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput,
): Promise<Room> {
  const result = await apiRequest<Room>(`/rooms/${id}`, {
    body: input,
    method: "PATCH",
  });

  return result.data;
}

export async function deleteRoom(id: string): Promise<Room> {
  const result = await apiRequest<Room>(`/rooms/${id}`, {
    method: "DELETE",
  });

  return result.data;
}

export async function updateRoomStatus(
  id: string,
  status: RoomStatus,
): Promise<Room> {
  const result = await apiRequest<Room>(`/rooms/${id}/status`, {
    body: { status },
    method: "PATCH",
  });

  return result.data;
}

export async function createRoomImage(
  roomId: string,
  input: CreateRoomImageInput,
): Promise<RoomImage> {
  const formData = new FormData();

  formData.append("file", input.file);

  if (input.isCover !== undefined) {
    formData.append("isCover", String(input.isCover));
  }

  if (input.sortOrder !== undefined) {
    formData.append("sortOrder", String(input.sortOrder));
  }

  const result = await apiRequest<RoomImage>(`/rooms/${roomId}/images`, {
    body: formData,
    method: "POST",
  });

  return result.data;
}

export async function deleteRoomImage(imageId: string): Promise<RoomImage> {
  const result = await apiRequest<RoomImage>(`/room-images/${imageId}`, {
    method: "DELETE",
  });

  return result.data;
}

export async function setRoomCoverImage(imageId: string): Promise<RoomImage> {
  const result = await apiRequest<RoomImage>(
    `/room-images/${imageId}/set-cover`,
    { method: "PATCH" },
  );

  return result.data;
}
