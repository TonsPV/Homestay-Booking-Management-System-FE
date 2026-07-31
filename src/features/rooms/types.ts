import type {
  BlockRoomDatesDto,
  RoomCreateData,
  RoomCreateImageData,
  RoomCalendarEntryDto,
  RoomDto,
  RoomImageDto,
  RoomListData,
  RoomManagementCalendarData,
  RoomManagementListData,
  RoomResponseRoomTypeDto,
  RoomSearchData,
  RoomStatus as GeneratedRoomStatus,
  RoomUpdateData,
  UnblockRoomDatesDto,
} from '@/api/generated'

export const ROOM_STATUSES = [
  'READY',
  'OCCUPIED',
  'CLEANING',
  'MAINTENANCE',
  'HIDDEN',
] as const satisfies readonly GeneratedRoomStatus[]

export type RoomStatus = GeneratedRoomStatus
export type ManagementRole = 'ADMIN' | 'STAFF'

export type RoomImage = RoomImageDto
export type RoomTypeSummary = RoomResponseRoomTypeDto
export type Room = RoomDto

export type ListRoomsQuery = NonNullable<RoomListData['query']>

export type ListManagementRoomsQuery = NonNullable<
  RoomManagementListData['query']
>

export type SearchRoomsQuery = RoomSearchData['query']

export type CreateRoomInput = RoomCreateData['body']

export type UpdateRoomInput = RoomUpdateData['body']

export type CreateRoomImageInput = Omit<
  RoomCreateImageData['body'],
  'file'
> & { file: File }

export type RoomCalendarEntry = RoomCalendarEntryDto
export type RoomCalendarRange = RoomManagementCalendarData['query']
export type BlockRoomDatesInput = BlockRoomDatesDto
export type UnblockRoomDatesResult = UnblockRoomDatesDto
