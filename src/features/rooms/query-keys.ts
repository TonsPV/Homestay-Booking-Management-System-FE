import type {
  ListAvailableRoomsQuery,
  ListManagementRoomsQuery,
  ListRoomsQuery,
  RoomCalendarRange,
  SearchRoomsQuery,
} from './types'


export const roomKeys = {
  all: ['rooms'] as const,
  detail: (id: string) => ['rooms', 'public', 'detail', id] as const,
  list: (query: ListRoomsQuery) =>
    ['rooms', 'public', 'list', query] as const,
  managementDetail: (id: string) =>
    ['rooms', 'management', 'detail', id] as const,
  managementList: (query: ListManagementRoomsQuery) =>
    ['rooms', 'management', 'list', query] as const,
  calendar: (id: string, range: RoomCalendarRange) =>
    ['rooms', 'management', 'calendar', id, range] as const,
  search: (query: SearchRoomsQuery) =>
    ['rooms', 'public', 'search', query] as const,
  available: (query: ListAvailableRoomsQuery) =>
    ['rooms', 'management', 'available', query] as const,
}


