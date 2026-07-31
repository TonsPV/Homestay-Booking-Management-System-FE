import { apiRequest } from '@/api/client'
import type { Pagination } from '@/api/types'

import type {
  AdminAmenity,
  Amenity,
  CreateAmenityInput,
  ListAdminAmenitiesQuery,
  ListAmenitiesQuery,
  UpdateAmenityInput,
} from './types'

export interface PaginatedAmenities<TItem> {
  items: TItem[]
  pagination?: Pagination
}

export async function listAmenities(
  query: ListAmenitiesQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedAmenities<Amenity>> {
  const result = await apiRequest<Amenity[]>('/amenities', {
    auth: false,
    query: {
      limit: query.limit,
      page: query.page,
      search: query.search,
    },
    signal,
  })

  return { items: result.data, pagination: result.meta?.pagination }
}

export async function listAllAmenities(
  signal?: AbortSignal,
): Promise<Amenity[]> {
  const firstPage = await listAmenities({ limit: 100, page: 1 }, signal)
  const totalPages = firstPage.pagination?.totalPages ?? 1

  if (totalPages <= 1) {
    return firstPage.items
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      listAmenities({ limit: 100, page: index + 2 }, signal),
    ),
  )

  return [
    ...firstPage.items,
    ...remainingPages.flatMap((page) => page.items),
  ]
}

export async function listAdminAmenities(
  query: ListAdminAmenitiesQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedAmenities<AdminAmenity>> {
  const result = await apiRequest<AdminAmenity[]>('/admin/amenities', {
    query: {
      includeDeleted: query.includeDeleted,
      limit: query.limit,
      page: query.page,
      search: query.search,
    },
    signal,
  })

  return { items: result.data, pagination: result.meta?.pagination }
}

export async function createAmenity(
  input: CreateAmenityInput,
): Promise<AdminAmenity> {
  const result = await apiRequest<AdminAmenity>('/admin/amenities', {
    body: input,
    method: 'POST',
  })

  return result.data
}

export async function updateAmenity(
  id: string,
  input: UpdateAmenityInput,
): Promise<AdminAmenity> {
  const result = await apiRequest<AdminAmenity>(`/admin/amenities/${id}`, {
    body: input,
    method: 'PATCH',
  })

  return result.data
}

export async function deleteAmenity(id: string): Promise<AdminAmenity> {
  const result = await apiRequest<AdminAmenity>(`/admin/amenities/${id}`, {
    method: 'DELETE',
  })

  return result.data
}

export async function restoreAmenity(id: string): Promise<AdminAmenity> {
  const result = await apiRequest<AdminAmenity>(
    `/admin/amenities/${id}/restore`,
    { method: 'PATCH' },
  )

  return result.data
}
