import type { ListAdminAmenitiesQuery } from './types'

export const amenityKeys = {
  all: ['amenities'] as const,
  allOptions: () => ['amenities', 'public', 'options'] as const,
  adminList: (query: ListAdminAmenitiesQuery) =>
    ['amenities', 'admin', 'list', query] as const,
}
