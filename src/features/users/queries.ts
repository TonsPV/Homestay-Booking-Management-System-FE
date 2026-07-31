import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { User } from '@/auth/types'

import {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from './api'
import type {
  CreateUserInput,
  UpdateUserRequest,
  UserListParams,
} from './types'

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => ['users', 'list'] as const,
  list: (params: UserListParams) => ['users', 'list', params] as const,
}

function replaceUserInLists(current: unknown, user: User) {
  if (
    typeof current !== 'object' ||
    current === null ||
    !('data' in current) ||
    !Array.isArray(current.data)
  ) {
    return current
  }

  return {
    ...current,
    data: current.data.map((item: User) =>
      item.id === user.id ? user : item,
    ),
  }
}

export function useAdminUsersQuery(params: UserListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => listUsers(params),
    queryKey: userQueryKeys.list(params),
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() }),
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateUserRequest) => updateUser(request),
    onSuccess: (user) => {
      queryClient.setQueriesData(
        { queryKey: userQueryKeys.lists() },
        (current) => replaceUserInLists(current, user),
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() }),
  })
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (user) => {
      queryClient.setQueriesData(
        { queryKey: userQueryKeys.lists() },
        (current) => replaceUserInLists(current, user),
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() }),
  })
}
