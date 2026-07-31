import type {
  CreateUserDtoWritable,
  UpdateUserDtoWritable,
  UserAdminListUsersData,
} from '@/api/generated'
import type { AccountStatus } from '@/auth/types'
import type { EntityId } from '@/shared/types/primitives'

export type UserListParams = NonNullable<UserAdminListUsersData['query']>

export type CreateUserInput = Omit<CreateUserDtoWritable, 'role'>

export type UpdateUserInput = Omit<UpdateUserDtoWritable, 'role'>

export interface UpdateUserRequest {
  id: EntityId
  input: UpdateUserInput
}

export interface UpdateUserStatusInput {
  id: EntityId
  status: AccountStatus
}
