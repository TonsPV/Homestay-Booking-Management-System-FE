import type { ListAdminRoomTypesQuery } from './types'

export const roomTypeKeys = {
  adminDetail: (id: string) =>
    ['room-types', 'admin', 'detail', id] as const,
  adminLists: () => ['room-types', 'admin', 'list'] as const,
  adminList: (query: ListAdminRoomTypesQuery) =>
    [...roomTypeKeys.adminLists(), query] as const,
  all: ['room-types'] as const,
  allOptions: () => ['room-types', 'public', 'options'] as const,
}
