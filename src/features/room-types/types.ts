import type {
  AdminRoomTypeDto,
  RoomTypeAdminCreateData,
  RoomTypeAdminListData,
  RoomTypeAdminSetAmenitiesData,
  RoomTypeAdminUpdateData,
  RoomTypeAmenityDto,
  RoomTypeDto,
  RoomTypeListData,
} from '@/api/generated'

export type RoomTypeAmenity = RoomTypeAmenityDto
export type RoomType = RoomTypeDto
export type AdminRoomType = AdminRoomTypeDto

export type ListRoomTypesQuery = NonNullable<RoomTypeListData['query']>

export type ListAdminRoomTypesQuery = NonNullable<
  RoomTypeAdminListData['query']
>

export type CreateRoomTypeInput = RoomTypeAdminCreateData['body']

export type UpdateRoomTypeInput = RoomTypeAdminUpdateData['body']

export type SetRoomTypeAmenitiesInput =
  RoomTypeAdminSetAmenitiesData['body']
