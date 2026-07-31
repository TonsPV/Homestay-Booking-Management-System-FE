import type {
  AdminAmenityDto,
  AmenityAdminCreateData,
  AmenityAdminListData,
  AmenityAdminUpdateData,
  AmenityDto,
  AmenityListData,
} from '@/api/generated'

export type Amenity = AmenityDto
export type AdminAmenity = AdminAmenityDto

export type ListAmenitiesQuery = NonNullable<AmenityListData['query']>

export type ListAdminAmenitiesQuery = NonNullable<
  AmenityAdminListData['query']
>

export type CreateAmenityInput = AmenityAdminCreateData['body']

export type UpdateAmenityInput = AmenityAdminUpdateData['body']
