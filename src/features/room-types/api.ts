import { apiRequest } from '@/api/client'
import type { Pagination } from '@/api/types'

import type {
  AdminRoomType,
  CreateRoomTypeInput,
  ListAdminRoomTypesQuery,
  ListRoomTypesQuery,
  RoomType,
  SetRoomTypeAmenitiesInput,
  UpdateRoomTypeInput,
} from './types'

export interface PaginatedRoomTypes<TItem> {
  items: TItem[]
  pagination?: Pagination
}

export async function listRoomTypes(
  query: ListRoomTypesQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedRoomTypes<RoomType>> {
  const result = await apiRequest<RoomType[]>('/room-types', {
    auth: false,
    query: {
      limit: query.limit,
      page: query.page,
      search: query.search,
    },
    signal,
  })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function listAllRoomTypes(
  signal?: AbortSignal,
): Promise<RoomType[]> {
  const firstPage = await listRoomTypes({ limit: 100, page: 1 }, signal)
  const totalPages = firstPage.pagination?.totalPages ?? 1

  if (totalPages <= 1) {
    return firstPage.items
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listRoomTypes({ limit: 100, page: index + 2 }, signal),
    ),
  )

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ]
}

export async function listAdminRoomTypes(
  query: ListAdminRoomTypesQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedRoomTypes<AdminRoomType>> {
  const result = await apiRequest<AdminRoomType[]>('/admin/room-types', {
    query: {
      includeDeleted: query.includeDeleted,
      limit: query.limit,
      page: query.page,
      search: query.search,
    },
    signal,
  })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function getAdminRoomType(
  id: string,
  signal?: AbortSignal,
): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>(`/admin/room-types/${id}`, {
    signal,
  })

  return result.data
}

export async function createRoomType(
  input: CreateRoomTypeInput,
): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>('/admin/room-types', {
    body: input,
    method: 'POST',
  })

  return result.data
}

export async function updateRoomType(
  id: string,
  input: UpdateRoomTypeInput,
): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>(
    `/admin/room-types/${id}`,
    {
      body: input,
      method: 'PATCH',
    },
  )

  return result.data
}

export async function deleteRoomType(id: string): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>(
    `/admin/room-types/${id}`,
    { method: 'DELETE' },
  )

  return result.data
}

export async function restoreRoomType(id: string): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>(
    `/admin/room-types/${id}/restore`,
    { method: 'PATCH' },
  )

  return result.data
}

export async function setRoomTypeAmenities(
  id: string,
  input: SetRoomTypeAmenitiesInput,
): Promise<AdminRoomType> {
  const result = await apiRequest<AdminRoomType>(
    `/admin/room-types/${id}/amenities`,
    { body: input, method: 'PUT' },
  )

  return result.data
}
