import { apiRequest } from '@/api/client'
import type { User } from '@/auth/types'

import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRequest,
  UpdateUserStatusInput,
  UserListParams,
} from './types'

export function listUsers(params: UserListParams) {
  return apiRequest<User[]>('/users', {
    query: { ...params },
  })
}

export async function createUser(input: CreateUserInput) {
  const body: CreateUserInput = {
    email: input.email,
    fullName: input.fullName,
    password: input.password,
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
  }
  const result = await apiRequest<User>('/users', {
    body,
    method: 'POST',
  })

  return result.data
}

export async function updateUser({ id, input }: UpdateUserRequest) {
  const body: UpdateUserInput = {
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.password !== undefined ? { password: input.password } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
  }
  const result = await apiRequest<User>(`/users/${id}`, {
    body,
    method: 'PATCH',
  })

  return result.data
}

export async function updateUserStatus({
  id,
  status,
}: UpdateUserStatusInput) {
  const result = await apiRequest<User>(`/users/${id}/status`, {
    body: { status },
    method: 'PATCH',
  })

  return result.data
}
